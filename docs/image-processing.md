# Image Processing with imgproxy

This document describes how to integrate imgproxy for on-the-fly image processing in the memudo application.

## Overview

imgproxy is a fast, secure image processing proxy that handles resizing, format conversion, and optimization on demand. Images are stored in PostgreSQL and transformed through imgproxy on demand. Transformed images are cached at the CDN level (Cloudflare) for optimal performance.

## Architecture

```
Client Request → CDN (Cloudflare) → Caddy → image service → App File Route → PostgreSQL
```

**Caching Strategy:**
- Original images: Stored in PostgreSQL
- Transformed images: Cached by Cloudflare CDN at edge locations
- No application-level caching: imgproxy transformations are cached entirely by the CDN

## URL Immutability & Cache Strategy

### Why URL Immutability Matters

For maximum CDN caching efficiency, image transformation URLs must be **immutable** - meaning the URL should never change unless the content changes. This allows us to use aggressive cache headers (`Cache-Control: public, max-age=31536000` - 1 year) without worrying about serving stale content.

### The Access Pattern

**First request for a specific transformation:**
```
Client → CDN (miss) → Caddy → image service → App /files/{id}?v={hash} → PostgreSQL
                                    ↓
                          imgproxy transforms image
                                    ↓
                          CDN caches transformed result
                                    ↓
                          Returns to client
```

**All subsequent requests (99.9% of traffic):**
```
Client → CDN (hit) → Returns transformed image directly
```

PostgreSQL is only accessed **once per unique transformation**, then the CDN serves all future requests from edge cache.

### How We Achieve Immutability

Each image URL includes the **hash** of the file content:

```
https://app.com/image/{signature}/rs:fit:300:300/base64(https://app.com/files/42?v=a1b2c3...)
                                                                                    ^^^^^^^^
                                                                           Hash ensures immutability
```

When the image changes:
- New upload → different hash
- Different hash → different URL
- Different URL → CDN cache miss → fetches new version
- Old URLs still work (content-addressed)

This means:
- ✅ Safe to use 1-year cache headers
- ✅ No manual cache purging needed
- ✅ Automatic cache invalidation on content change
- ✅ Historical versions remain accessible

### Why PostgreSQL Storage Works Here

Given this caching pattern, storing images in PostgreSQL is completely appropriate because:

1. **Rare access** - PostgreSQL reads happen only on CDN cache misses
2. **Cold start only** - First transformation request per size/format
3. **CDN absorbs all load** - Edge servers handle 99.9%+ of traffic
4. **Simple architecture** - No need for separate object storage service

Example: 1,000 images × 3 transformations = 3,000 PostgreSQL reads total, then millions of CDN hits.

## Docker Compose Configuration

Add the image service to `run/development/docker-compose.yml`:

```yaml
services:
  # ... existing services ...

  image:
    image: darthsim/imgproxy:latest
    restart: unless-stopped
    environment:
      IMGPROXY_KEY: ${IMGPROXY_KEY}
      IMGPROXY_SALT: ${IMGPROXY_SALT}
      IMGPROXY_LOCAL_FILESYSTEM_ROOT: /
      IMGPROXY_USE_ETAG: "true"
      IMGPROXY_ENABLE_WEBP_DETECTION: "true"
      IMGPROXY_ENFORCE_WEBP: "false"
      IMGPROXY_MAX_SRC_RESOLUTION: 50.0
      IMGPROXY_MAX_ANIMATION_FRAMES: 500
    ports:
      - "8082:8080"
    depends_on:
      app:
        condition: service_started
    healthcheck:
      test: ["CMD", "imgproxy", "health"]
      interval: 10s
      timeout: 5s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 256M
```

## Caddyfile Configuration

Update `run/development/Caddyfile` to route image transformation requests:

```caddyfile
dev.memudo.rent {
  tls /etc/ssl/certs/dev.memudo.rent+1.pem /etc/ssl/private/dev.memudo.rent+1-key.pem

  handle /image/* {
    uri strip_prefix /image
    reverse_proxy image:8080
  }

  handle /nominatim/* {
    uri strip_prefix /nominatim
    reverse_proxy nominatim:8080
  }

  reverse_proxy app:5173
}
```

## Environment Variables

Add to `.env`:

```bash
# Image service security keys (generate with: openssl rand -hex 32)
IMGPROXY_KEY=your_random_hex_key_here
IMGPROXY_SALT=your_random_hex_salt_here
```

Add to `.env.template`:

```bash
IMGPROXY_KEY=""
IMGPROXY_SALT=""
```

## Utility Module

Create `app/lib/server/image.ts`:

```typescript
import { createHmac } from "node:crypto"

interface ImageOptions {
  width?: number
  height?: number
  resize_type?: "fit" | "fill" | "auto" | "force"
  gravity?: "no" | "ce" | "sm" | "no" | "ea" | "we" | "nowe" | "noea" | "sowe" | "soea"
  enlarge?: boolean
  format?: "jpg" | "png" | "webp" | "avif" | "gif"
  quality?: number
  blur?: number
  sharpen?: number
}

function get_env_var(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`)
  }
  return value
}

function sign_path(path: string): string {
  const key = get_env_var("IMGPROXY_KEY")
  const salt = get_env_var("IMGPROXY_SALT")

  const key_buffer = Buffer.from(key, "hex")
  const salt_buffer = Buffer.from(salt, "hex")

  const hmac = createHmac("sha256", key_buffer)
  hmac.update(salt_buffer)
  hmac.update(path)

  return hmac.digest("base64url")
}

function build_processing_options(options: ImageOptions): string {
  const parts: string[] = []

  // Resize: rs:fit:300:200:0:0
  if (options.width || options.height) {
    const resize_type = options.resize_type || "fit"
    const width = options.width || 0
    const height = options.height || 0
    const enlarge = options.enlarge ? 1 : 0
    parts.push(`rs:${resize_type}:${width}:${height}:${enlarge}`)
  }

  // Gravity: g:ce
  if (options.gravity) {
    parts.push(`g:${options.gravity}`)
  }

  // Quality: q:80
  if (options.quality !== undefined) {
    parts.push(`q:${options.quality}`)
  }

  // Blur: bl:5
  if (options.blur !== undefined) {
    parts.push(`bl:${options.blur}`)
  }

  // Sharpen: sh:1.5
  if (options.sharpen !== undefined) {
    parts.push(`sh:${options.sharpen}`)
  }

  // Format: format:webp
  if (options.format) {
    parts.push(`format:${options.format}`)
  }

  return parts.join("/")
}

export function generate_image_url(
  file_id: number,
  hash: string,
  options: ImageOptions = {},
): string {
  const base_url = process.env.NODE_ENV === "production"
    ? "https://memudo.rent"
    : "https://dev.memudo.rent"

  // Source URL that the image service will fetch
  // Include hash for URL immutability and cache busting
  const source_url = `${base_url}/files/${file_id}?v=${hash}`
  const encoded_source_url = Buffer.from(source_url).toString("base64url")

  // Build processing options
  const processing_options = build_processing_options(options)

  // Build path: /processing_options/encoded_source_url
  const path = `/${processing_options}/${encoded_source_url}`

  // Sign the path
  const signature = sign_path(path)

  // Return full image URL (immutable due to hash)
  return `${base_url}/image/${signature}${path}`
}

export function generate_thumbnail_url(
  file_id: number,
  hash: string,
  size: number = 150,
): string {
  return generate_image_url(file_id, hash, {
    width: size,
    height: size,
    resize_type: "fill",
    gravity: "ce",
    format: "webp",
    quality: 80,
  })
}

export function generate_responsive_url(
  file_id: number,
  hash: string,
  width: number,
): string {
  return generate_image_url(file_id, hash, {
    width,
    resize_type: "fit",
    format: "webp",
    quality: 85,
  })
}
```

## Usage Examples

### Basic Thumbnail

```typescript
import { generate_thumbnail_url } from "~/lib/server/image"

// In a loader or action
export async function loader({ params }: Route.LoaderArgs) {
  // Fetch property with file metadata including hash
  const property = await db.query(`
    SELECT p.*, f.id as image_file_id, f.hash as image_hash
    FROM property p
    LEFT JOIN file f ON p.image_file_id = f.id
    WHERE p.id = $1
  `, [params.property_id])

  const thumbnail_url = generate_thumbnail_url(
    property.image_file_id,
    property.image_hash,
    200
  )

  return { property, thumbnail_url }
}
```

### Responsive Images

```typescript
import { generate_responsive_url } from "~/lib/server/image"

export async function loader() {
  // Fetch properties with file hash for immutable URLs
  const properties = await db.query(`
    SELECT p.*, f.id as image_file_id, f.hash as image_hash
    FROM property p
    LEFT JOIN file f ON p.image_file_id = f.id
  `)

  const properties_with_images = properties.map((property) => ({
    ...property,
    image_urls: {
      small: generate_responsive_url(property.image_file_id, property.image_hash, 400),
      medium: generate_responsive_url(property.image_file_id, property.image_hash, 800),
      large: generate_responsive_url(property.image_file_id, property.image_hash, 1200),
    },
  }))

  return { properties: properties_with_images }
}
```

### Custom Transformations

```typescript
import { generate_image_url } from "~/lib/server/image"

// Fetch file with hash
const file = await db.query(
  "SELECT id, hash FROM file WHERE id = $1",
  [file_id]
)

// Blurred background
const blurred_bg = generate_image_url(file.id, file.hash, {
  width: 1920,
  height: 1080,
  resize_type: "fill",
  blur: 50,
  quality: 60,
  format: "webp",
})

// Avatar with specific size
const avatar = generate_image_url(file.id, file.hash, {
  width: 128,
  height: 128,
  resize_type: "fill",
  gravity: "ce",
  format: "webp",
  quality: 90,
})

// High quality detail view
const detail_view = generate_image_url(file.id, file.hash, {
  width: 2400,
  resize_type: "fit",
  sharpen: 1.2,
  format: "jpg",
  quality: 95,
})
```

### In React Components

```tsx
export default function PropertyCard({
  property
}: {
  property: { id: number; image_file_id: number; name: string }
}) {
  return (
    <div>
      <img
        src={property.image_urls.small}
        srcSet={`
          ${property.image_urls.small} 400w,
          ${property.image_urls.medium} 800w,
          ${property.image_urls.large} 1200w
        `}
        sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
        alt={property.name}
      />
    </div>
  )
}
```

## Direct URL Format

Image transformation URLs follow this pattern:

```
https://dev.memudo.rent/image/{signature}/{processing_options}/{encoded_source_url}
```

Example:
```
https://dev.memudo.rent/image/abc123.../rs:fit:300:200:0/format:webp/aHR0cHM6Ly9kZXYubWVtdWRvLnJlbnQvZmlsZXMvNDI=
```

## Security

- The image service requires HMAC signatures to prevent URL tampering
- Source URLs must point to `/files/$id` routes within the app
- Only authenticated file access is allowed (files route checks permissions)
- Generate IMGPROXY_KEY and IMGPROXY_SALT with: `openssl rand -hex 32`

## Performance Considerations

1. **CDN Caching**: Transformed images are cached at the CDN edge (Cloudflare)
2. **ETags**: The image service supports ETags for efficient cache validation
3. **Memory**: Limit the image service to ~256M for development
4. **No Application Caching**: Original files are served directly from PostgreSQL without caching

## Cloudflare CDN Configuration

Configure Cloudflare to cache transformed images:

### Cache Rules

Create a cache rule for `/image/*` paths:

```
Rule name: Cache Image Transformations
Match: URI Path starts with /image/

Settings:
- Cache Status: Eligible for cache
- Edge Cache TTL: 30 days
- Browser Cache TTL: 7 days
- Respect Origin Cache-Control: Yes
- Cache Key: Include query string
```

### Page Rules (Alternative)

If using Page Rules instead:

```
URL: *memudo.rent/image/*

Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 week
```

### Recommended Headers

The image service automatically sends proper cache headers:
- `Cache-Control: public, max-age=31536000, immutable` (1 year cache - safe because URLs include hash)
- `ETag: <hash>` for cache validation
- `Vary: Accept` for content negotiation (WebP detection)

**Why 1-year cache is safe:**

Since every URL includes the file's hash (`/files/{id}?v={hash}`), the URL is **content-addressed** and truly immutable:

- Same content → same hash → same URL → can cache forever
- Different content → different hash → different URL → automatic cache invalidation
- No manual purging needed - new images automatically get new URLs

This allows maximum CDN efficiency: after the first request, the CDN serves all subsequent requests without ever touching your origin server or database.

## Cache Invalidation Strategy

### Automatic Invalidation via Content-Addressed URLs

With hash-based URLs, cache invalidation happens **automatically** without manual intervention:

```
Old image (file_id=42, hash=abc123...)
→ URL: /image/{sig}/rs:fit:300:300/base64(.../files/42?v=abc123...)
→ CDN caches this URL

User uploads new image to replace file_id=42 (hash=xyz789...)
→ URL: /image/{sig}/rs:fit:300:300/base64(.../files/42?v=xyz789...)
→ Different URL = CDN cache miss = fetches new version
→ Old URL still cached (and still works if accessed)
```

### When CDN Accesses PostgreSQL

The CDN will cause a PostgreSQL read only when:

1. **First transformation request** - New combination of (file, size, format, quality)
2. **New image upload** - Different hash = different URL = cache miss
3. **Cache expiration** - After 30 days (Edge TTL), though unlikely to matter
4. **Manual purge** - If you explicitly purge Cloudflare cache (rarely needed)

### No Manual Purging Required

You **do not need to**:
- ❌ Purge CDN cache when images change
- ❌ Version URLs manually
- ❌ Worry about serving stale images
- ❌ Set up cache invalidation webhooks

The hash in the URL handles this automatically.

### Database Considerations

**On image upload:**
```sql
-- Calculate hash during upload
INSERT INTO file (basename, mime, size, hash, content)
VALUES ($1, $2, $3, encode(sha256($4), 'hex'), $4)
RETURNING id, hash;
```

**On image retrieval for URL generation:**
```sql
-- Always fetch hash along with file_id
SELECT id, hash FROM file WHERE id = $1;
```

The `hash` column is already part of your schema (see migration `1757010379262_add_file.ts`).

## Deployment Checklist

- [ ] Generate secure IMGPROXY_KEY and IMGPROXY_SALT
- [ ] Add image service to docker-compose
- [ ] Update Caddyfile routing to use `/image/*` path
- [ ] Set memory limits appropriately (256M for development, higher for production)
- [ ] Configure Cloudflare cache rules for `/image/*` paths
- [ ] Enable Cloudflare Auto Minify for images
- [ ] Test image transformations across formats
- [ ] Monitor image service memory usage
- [ ] Verify CDN cache hit rates in Cloudflare Analytics

## References

- [imgproxy Documentation](https://docs.imgproxy.net/)
- [imgproxy Generating URL](https://docs.imgproxy.net/usage/processing)
- [imgproxy Security](https://docs.imgproxy.net/configuration/security)
