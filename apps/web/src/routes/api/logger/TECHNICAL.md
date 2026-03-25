# /api/logger

## Endpoint (`+server.ts` — POST only)
Proxies client-side log data to the OpenTelemetry collector at `http://otel-collector:4318/v1/logs`. Forwards the request body as-is with the original `Content-Type` header.

## Auth
None — public endpoint (client-side logging needs to work without auth).
