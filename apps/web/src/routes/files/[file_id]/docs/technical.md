# /files/[file_id]

## Endpoint (`+server.ts` — GET only)

Serves files by ID with access control and caching.

### Access control

1. If `?secret=` matches `IMGPROXY_SOURCE_SECRET` → bypass auth (for imgproxy image processing)
2. Otherwise requires authenticated user
3. Checks file ownership via `get_file_property_id()` which searches across: `property_file`, `contract_file`, `contract_item_file`, `receipt`, and `user_file` (returns null for user files)
4. For property-linked files: `require_view_access()` on the property
5. For user files: matches `user_id`

### Caching

Uses Redis (kv) hash: `file:{id}` with fields `basename`, `content` (base64), `mime`. Cache-first with DB fallback.

### Response headers

`Content-Type`, `Content-Disposition: inline`, `X-Content-Type-Options: nosniff`, `Cache-Control: private, no-cache, no-store`

## Auth

Requires authenticated user OR imgproxy secret. Returns 401/403 on auth failure.
