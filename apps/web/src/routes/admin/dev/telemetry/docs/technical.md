# Technical

## Auth gate

`+page.server.ts` returns 404 if `process.env.OTEL_ENVIRONMENT !== "development"`, then `require_authentication`, then 403 if not `is_webmaster`. The 404-first ordering means a deployed-by-accident copy is invisible to non-dev environments.

## Remote forms

One file per scenario in `forms/`. Each is a SvelteKit `form()` that:

1. Captures `trace.getActiveSpan()?.spanContext().traceId` at the start.
2. Triggers the scenario (throw / log / nested span).
3. Returns `{ trace_id }` so the page can render a click-through link.

Scenarios:

- `throw_sync.remote.ts` — synchronous `throw new Error` inside a helper, caught + `logger.unknown`.
- `throw_async.remote.ts` — promise rejection inside an async chain, caught + `logger.error` with user attrs.
- `log_caught.remote.ts` — explicit `logger.error(msg, attrs, err)` on caught error to verify attribute merging.
- `log_levels.remote.ts` — emits `info`, `warn`, or `error` log without a thrown error. Validates severity-number → severity-label rendering in the observability UI.
- `nested_spans.remote.ts` — manually creates outer + inner spans via `tracer.startActiveSpan`. Logs from the inner scope must inherit the same `trace_id`.
- `log_unknown.remote.ts` — throws a non-Error value (a plain string). Validates `logger.unknown` synthetic-Error path.

## What this page proves

A single click drives the full pipeline: app → `instrument.mjs` → OTel SDK → collector (`100ms` batch in dev) → ClickHouse → observability UI. The `trace_id` shown on the page must match the `TraceId` column on the corresponding log row in `/logs`.

## Not for production

This route is a dev tool, not a feature. It has no tests of its own; the underlying telemetry primitives (`parse_stack_frame`, `read_vcs`, `logger`) are tested under `apps/web/src/lib/telemetry/`.
