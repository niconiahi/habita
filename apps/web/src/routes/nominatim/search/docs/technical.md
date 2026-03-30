# /nominatim/search

## Endpoint (`+server.ts` — GET only)

Proxies location search queries to the self-hosted Nominatim instance at `http://nominatim:8080/search`.

### Parameters

- `?q=` — search query (max 200 chars)

### Protections

- Query length limit: 200 characters → 400
- Request timeout: 5 seconds → 504
- Response size limit: 1MB → 502
- Content-type validation: must be `application/json` → 502

### Error handling

Uses `safe_async` for fetch and `safe_sync` for JSON parsing. All errors logged with context.

## Auth

None — used by client-side location inputs.
