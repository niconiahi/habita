# Cloudflare CDN Configuration

This document describes how to configure Cloudflare as a CDN for habita, respecting origin-controlled cache headers for optimal performance.

## Overview

Cloudflare acts as a global CDN layer that caches content at edge locations worldwide. Instead of managing cache policies in the Cloudflare dashboard, we control caching behavior through `Cache-Control` headers sent from our application code.

**Benefits of this approach:**
- Cache policies are version-controlled in code
- Easy to adjust per environment or route
- Self-documenting through code comments
- No manual dashboard configuration needed for cache durations
- Consistent behavior across environments

## Architecture

```
Client Request → Cloudflare Edge → Origin Server (Caddy → App/imgproxy)
                      ↓
                Cache based on
                origin headers
```

**Caching Strategy:**
- Origin (our app) sends `Cache-Control` headers
- Cloudflare respects these headers
- Edge servers cache content globally
- Subsequent requests served from edge (no origin hit)

## Cache Header Strategy

All files and images **always** include a hash parameter in the URL, making them content-addressed and safe for aggressive caching:

```
/files/3?v=abc123...        → Cache-Control: public, max-age=31536000, immutable
/image/{sig}/rs:fit:400/... → Cache-Control: public, max-age=31536000, immutable
```

**Why 1 year cache is safe:**
- Hash in URL makes it content-addressed
- Same content → same hash → same URL
- Different content → different hash → different URL
- No manual cache purging needed
- Old URLs still work if accessed

**Important:** We never expose file URLs without hash parameters. All file access goes through the application, which automatically appends the hash.

## Cloudflare Configuration

### Prerequisites

1. Domain must be added to Cloudflare
2. DNS records must be proxied (orange cloud icon)
3. SSL/TLS mode set to "Full" or "Full (strict)"

### Step 1: Verify DNS Proxy Status

**For Production (`habita.rent`):**

1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select domain: `habita.rent`
3. Go to **DNS** → **Records**
4. Find your A/AAAA record for the root domain or subdomain
5. Ensure the cloud icon is **orange** (proxied)
   - Orange = Proxied through Cloudflare CDN ✅
   - Gray = DNS only (CDN disabled) ❌

**For Development (`dev.habita.rent`):**

Development can be either:
- **Orange cloud** - Test CDN behavior in dev environment
- **Gray cloud** - Skip CDN in dev, direct connection to origin

**Recommendation**: Keep dev as gray cloud, enable CDN only for production/staging.

### Step 2: Configure Cache Rules

Cloudflare offers two methods. Use **Cache Rules** (newer, recommended).

#### Option A: Cache Rules (Recommended)

Go to **Caching** → **Cache Rules** → **Create rule**

**Rule 1: Cache Image Transformations**

```
Rule name: Cache Image Transformations

When incoming requests match:
  Field: URI Path
  Operator: starts with
  Value: /image/

Then:
  Cache eligibility: Eligible for cache
  Edge Cache TTL: Respect origin headers
  Browser Cache TTL: Respect origin headers
```

Click **Deploy**

**Rule 2: Cache Source Files**

```
Rule name: Cache Source Files

When incoming requests match:
  Field: URI Path
  Operator: starts with
  Value: /files/

Then:
  Cache eligibility: Eligible for cache
  Edge Cache TTL: Respect origin headers
  Browser Cache TTL: Respect origin headers
```

Click **Deploy**

#### Option B: Page Rules (Legacy - if Cache Rules unavailable)

Go to **Rules** → **Page Rules** → **Create Page Rule**

**Page Rule 1:**
```
URL: *habita.rent/image/*

Settings:
  Cache Level: Cache Everything
  Origin Cache Control: On
```

**Page Rule 2:**
```
URL: *habita.rent/files/*

Settings:
  Cache Level: Cache Everything
  Origin Cache Control: On
```

**Note**: Page Rules have limits (3 free, more on paid plans). Cache Rules are better.

### Step 3: Verify Configuration

After creating rules:

1. Go to **Caching** → **Cache Rules**
2. Verify both rules are listed as "Active"
3. Check rule order (doesn't matter in this case, but more specific rules should be first)

## Testing & Verification

### Test 1: Verify Cache Headers Locally

Before testing Cloudflare, verify your origin sends correct headers:

```bash
# Test image transformation
curl -I https://dev.habita.rent/image/[your-image-url] | grep -i cache-control
# Expected: Cache-Control: public, max-age=31536000, immutable

# Test source file with hash (always includes hash)
curl -I "https://dev.habita.rent/files/3?v=abc123..." | grep -i cache-control
# Expected: Cache-Control: public, max-age=31536000, immutable
```

### Test 2: Verify Cloudflare CDN Behavior

Only works if domain is proxied (orange cloud):

```bash
# First request (should be cache MISS)
curl -I https://habita.rent/image/[url] | grep -i cf-cache-status
# Expected: CF-Cache-Status: MISS or DYNAMIC or EXPIRED

# Second request (should be cache HIT)
curl -I https://habita.rent/image/[url] | grep -i cf-cache-status
# Expected: CF-Cache-Status: HIT
```

**CF-Cache-Status values:**
- `HIT` - Served from Cloudflare cache ✅
- `MISS` - Not in cache, fetched from origin
- `EXPIRED` - Was cached but expired, revalidating
- `DYNAMIC` - Cloudflare determined content is dynamic
- `BYPASS` - Cache was bypassed (check cache rules)

### Test 3: Browser Developer Tools

1. Open browser DevTools → **Network** tab
2. Navigate to properties page with images
3. Click on an image request
4. Check **Response Headers**:

```
Cache-Control: public, max-age=31536000, immutable
CF-Cache-Status: MISS (first time) or HIT (subsequent)
CF-Ray: xxxx-XXX (confirms request went through Cloudflare)
Age: 0 (first time) or >0 (from cache)
Server: cloudflare
```

### Test 4: Verify Cache Hit Rate

After some traffic:

1. Go to Cloudflare Dashboard
2. Select domain
3. Navigate to **Analytics** → **Traffic** → **Caching**
4. Check **Cache Hit Ratio** over time
5. Goal: 90%+ cache hit rate for `/image/*` and `/files/*` paths

## Cache Purging

### Automatic Cache Invalidation

With hash-based URLs (which we use for **all** files and images), cache invalidation happens **automatically**:

```
Old image: /files/42?v=abc123... → Cached at edge
User uploads new image: /files/42?v=xyz789... → New URL, cache miss, fetches new version
```

**You do NOT need to purge cache manually** when content changes. Ever.

### Manual Purge (for debugging only)

Only needed for debugging or troubleshooting:

1. Go to **Caching** → **Configuration**
2. Click **Purge Everything** (nuclear option) OR
3. Click **Custom Purge** → Enter specific URLs

**Warning**: Purging cache causes origin load spike as cache rebuilds. Should rarely be needed since all URLs are hash-based.

## Troubleshooting

### Issue: CF-Cache-Status is always BYPASS or DYNAMIC

**Possible causes:**
1. Cache Rules not configured correctly
2. Domain not proxied (gray cloud instead of orange)
3. Origin sending cache-busting headers (e.g., `Set-Cookie`)

**Fix:**
- Verify orange cloud in DNS settings
- Check Cache Rules are deployed and active
- Ensure origin doesn't send `Set-Cookie` on static assets

### Issue: Stale content being served

**Possible causes:**
1. Hash not updated when file changed
2. Application error in hash generation

**Fix:**
- Verify hash is recalculated when file content changes
- Check database has updated hash value
- All URLs automatically include hash parameters in this application

### Issue: Cache hit rate is low

**Possible causes:**
1. Not enough traffic (cache items expiring before reuse)
2. Hash changing unnecessarily (file reuploads with same content)
3. Cache headers not being sent correctly

**Fix:**
- Verify Cache-Control headers are being sent (all should be max-age=31536000)
- Check that hash generation is consistent for same file content
- Monitor with more traffic over time

## Monitoring

### Key Metrics to Track

1. **Cache Hit Ratio** (Cloudflare Analytics)
   - Target: >90% for `/image/*` and `/files/*`
   - Low ratio = too much origin traffic

2. **Bandwidth Savings** (Cloudflare Analytics)
   - Shows how much traffic CDN handled vs origin
   - Higher = better cost savings

3. **Origin Response Time** (Application monitoring)
   - Should be low frequency (only cache misses)

4. **Edge Response Time** (Cloudflare Analytics)
   - Should be <50ms globally

## Deployment Checklist

- [ ] Verify domain is added to Cloudflare
- [ ] Ensure DNS records are proxied (orange cloud) for production
- [ ] Set SSL/TLS mode to "Full" or "Full (strict)"
- [ ] Create Cache Rule for `/image/*` path (respect origin headers)
- [ ] Create Cache Rule for `/files/*` path (respect origin headers)
- [ ] Verify rules are active in dashboard
- [ ] Test cache headers locally with curl
- [ ] Test CF-Cache-Status with curl (MISS then HIT)
- [ ] Test in browser DevTools (check CF-Ray and CF-Cache-Status headers)
- [ ] Monitor cache hit ratio in Cloudflare Analytics
- [ ] Document any custom rules or exceptions

## Environment-Specific Configuration

### Development (`dev.habita.rent`)

**Recommended:** DNS-only (gray cloud)
- No CDN caching in dev
- Faster iteration and testing
- See changes immediately

**Alternative:** Proxied (orange cloud)
- Test CDN behavior in dev
- Since all URLs have hashes, cache invalidation is automatic

### Staging (if applicable)

**Recommended:** Proxied (orange cloud)
- Test CDN caching before production
- Same setup as production

### Production (`habita.rent`)

**Required:** Proxied (orange cloud)
- Full CDN caching enabled
- Cache Rules active
- Monitor cache hit rates

## References

- [Cloudflare Cache Rules Documentation](https://developers.cloudflare.com/cache/how-to/cache-rules/)
- [Understanding Cache-Control Headers](https://developers.cloudflare.com/cache/concepts/cache-control/)
- [Origin Cache-Control](https://developers.cloudflare.com/cache/concepts/cache-control/#origin-cache-control)
- [Cloudflare Analytics](https://developers.cloudflare.com/analytics/)
