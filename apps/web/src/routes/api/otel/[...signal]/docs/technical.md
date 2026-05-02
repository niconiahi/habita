# /api/otel/[...signal]

## Endpoint (`+server.ts` — POST only)

Proxies OpenTelemetry signals to the OTEL collector at `OTEL_ENDPOINT`.

### Allowed signals

`v1/traces`, `v1/logs` — validated against `ALLOWED_SIGNALS` Set. Returns 404 for unsupported signals.

### Flow

1. Validates signal against whitelist
2. `require_otel_endpoint(env)` — ensures `OTEL_ENDPOINT` is configured
3. Proxies request body as `ArrayBuffer` (no parsing overhead)
4. Preserves `Content-Type` header (defaults to `application/json`)
5. Returns collector's response status and body

## Auth

None — public endpoint for telemetry ingestion.
