# Image Processing with imgproxy

This document describes how to integrate imgproxy for on-the-fly image processing in the memudo application.

## Overview

imgproxy is a fast, secure image processing proxy that handles resizing, format conversion, and optimization on demand. Images are stored in PostgreSQL, cached in Valkey, and transformed through imgproxy when needed.

## Architecture

```
Client Request → Caddy → imgproxy → App File Route → Valkey Cache → PostgreSQL
```

## Docker Compose Configuration

Add the imgproxy service to `run/development/docker-compose.yml`:

```yaml
services:
  # ... existing services ...

  imgproxy:
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

Update `run/development/Caddyfile` to route imgproxy requests:

```caddyfile
dev.memudo.rent {
  tls /etc/ssl/certs/dev.memudo.rent+1.pem /etc/ssl/private/dev.memudo.rent+1-key.pem

  handle /imgproxy/* {
    uri strip_prefix /imgproxy
    reverse_proxy imgproxy:8080
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
# imgproxy security keys (generate with: openssl rand -hex 32)
IMGPROXY_KEY=your_random_hex_key_here
IMGPROXY_SALT=your_random_hex_salt_here
```

Add to `.env.template`:

```bash
IMGPROXY_KEY=""
IMGPROXY_SALT=""
```

## Utility Module

Create `app/lib/server/imgproxy.ts`:

```typescript
import { createHmac } from "node:crypto"

interface ImgproxyOptions {
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

function build_processing_options(options: ImgproxyOptions): string {
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

export function generate_imgproxy_url(
  file_id: number,
  options: ImgproxyOptions = {},
): string {
  const base_url = process.env.NODE_ENV === "production"
    ? "https://memudo.rent"
    : "https://dev.memudo.rent"

  // Source URL that imgproxy will fetch
  const source_url = `${base_url}/files/${file_id}`
  const encoded_source_url = Buffer.from(source_url).toString("base64url")

  // Build processing options
  const processing_options = build_processing_options(options)

  // Build path: /processing_options/encoded_source_url
  const path = `/${processing_options}/${encoded_source_url}`

  // Sign the path
  const signature = sign_path(path)

  // Return full imgproxy URL
  return `${base_url}/imgproxy/${signature}${path}`
}

export function generate_thumbnail_url(file_id: number, size: number = 150): string {
  return generate_imgproxy_url(file_id, {
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
  width: number,
): string {
  return generate_imgproxy_url(file_id, {
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
import { generate_thumbnail_url } from "~/lib/server/imgproxy"

// In a loader or action
export async function loader({ params }: Route.LoaderArgs) {
  const property = await get_property(params.property_id)
  const thumbnail_url = generate_thumbnail_url(property.image_file_id, 200)

  return { property, thumbnail_url }
}
```

### Responsive Images

```typescript
import { generate_responsive_url } from "~/lib/server/imgproxy"

export async function loader() {
  const properties = await get_properties()

  const properties_with_images = properties.map((property) => ({
    ...property,
    image_urls: {
      small: generate_responsive_url(property.image_file_id, 400),
      medium: generate_responsive_url(property.image_file_id, 800),
      large: generate_responsive_url(property.image_file_id, 1200),
    },
  }))

  return { properties: properties_with_images }
}
```

### Custom Transformations

```typescript
import { generate_imgproxy_url } from "~/lib/server/imgproxy"

// Blurred background
const blurred_bg = generate_imgproxy_url(file_id, {
  width: 1920,
  height: 1080,
  resize_type: "fill",
  blur: 50,
  quality: 60,
  format: "webp",
})

// Avatar with specific size
const avatar = generate_imgproxy_url(file_id, {
  width: 128,
  height: 128,
  resize_type: "fill",
  gravity: "ce",
  format: "webp",
  quality: 90,
})

// High quality detail view
const detail_view = generate_imgproxy_url(file_id, {
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

imgproxy URLs follow this pattern:

```
https://dev.memudo.rent/imgproxy/{signature}/{processing_options}/{encoded_source_url}
```

Example:
```
https://dev.memudo.rent/imgproxy/abc123.../rs:fit:300:200:0/format:webp/aHR0cHM6Ly9kZXYubWVtdWRvLnJlbnQvZmlsZXMvNDI=
```

## Security

- imgproxy requires HMAC signatures to prevent URL tampering
- Source URLs must point to `/files/$id` routes within the app
- Only authenticated file access is allowed (files route checks permissions)
- Generate IMGPROXY_KEY and IMGPROXY_SALT with: `openssl rand -hex 32`

## Performance Considerations

1. **Caching**: imgproxy supports ETags and browser caching
2. **Memory**: Limit imgproxy to ~256M for development
3. **Source Caching**: Original files cached in Valkey (15min TTL)
4. **CDN Ready**: In production, put CloudFlare/CloudFront in front of imgproxy URLs

## Deployment Checklist

- [ ] Generate secure IMGPROXY_KEY and IMGPROXY_SALT
- [ ] Add imgproxy service to docker-compose
- [ ] Update Caddyfile routing
- [ ] Set memory limits appropriately
- [ ] Configure CDN caching rules for `/imgproxy/*` paths
- [ ] Test image transformations across formats
- [ ] Monitor imgproxy memory usage

## References

- [imgproxy Documentation](https://docs.imgproxy.net/)
- [imgproxy Generating URL](https://docs.imgproxy.net/usage/processing)
- [imgproxy Security](https://docs.imgproxy.net/configuration/security)
