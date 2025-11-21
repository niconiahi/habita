# OpenTelemetry Observability Implementation Plan

## Goals
- Instrument web app and Go service with OpenTelemetry
- Custom logger with trace context (TS and Go)
- Focus on debugging errors and understanding request flows
- No metrics (for now)

---

## Phase 1: Infrastructure

- [x] **Add SigNoz to docker-compose.yml**
  - Services: `signoz-collector`, `clickhouse`, `signoz-query-service`, `signoz-frontend`, `signoz-alertmanager`
  - Config files: `telemetry.yaml`, `signoz.yaml`
  - Ports: UI (3301), OTLP gRPC (4317), OTLP HTTP (4318)
  - Add volumes for data persistence
  - Access: http://localhost:3301

- [x] **Update environment variables**
  - Added to `.env`:
    - `OTEL_EXPORTER_OTLP_ENDPOINT=http://signoz-collector:4318`
    - `OTEL_SERVICE_NAME=web` (or `go` for Go service)
    - `OTEL_ENVIRONMENT=development`

---

## Phase 2: Web App - OpenTelemetry Setup

### 2.1 Install Dependencies

- [x] **Install OTel packages (via Bun)**
  ```bash
  bun add @opentelemetry/api
  bun add @opentelemetry/sdk-node
  bun add @opentelemetry/resources
  bun add @opentelemetry/semantic-conventions
  bun add @opentelemetry/exporter-trace-otlp-http
  bun add @opentelemetry/exporter-logs-otlp-http
  bun add @opentelemetry/instrumentation-http
  bun add @opentelemetry/instrumentation-undici
  bun add @opentelemetry/auto-instrumentations-node
  bun add @opentelemetry/sdk-logs
  ```

### 2.2 Core Setup Files

- [x] **Create `/apps/web/app/lib/observability.server.ts`**
  - Initialize NodeSDK with OTLP exporters (traces + logs)
  - Configure resource with service metadata
  - Auto-instrumentation for HTTP/common libraries
  - Start SDK on import
  - **Note:** No helper functions - use `trace` from `@opentelemetry/api` directly

- [x] **Create `/apps/web/app/entry.server.tsx`**
  - Import `observability.server.ts` FIRST (before React Router)
  - This ensures SDK initializes before app code

---

## Phase 3: Custom Logger (TypeScript)

- [x] **Create `/apps/web/app/lib/telemetry/log.server.ts`**

  **Logger API (unified with Go)**:
  ```typescript
  export const logger = {
    info(message: string, fields?: Record<string, unknown>): void
    warn(message: string, fields?: Record<string, unknown>): void
    error(message: string, fields?: Record<string, unknown>, error?: Error): void
  }
  ```

  **What the logger should do**:
  - Extract current span using `trace.getActiveSpan()`
  - Get `trace_id` and `span_id` from span context
  - Format log as JSON:
    ```json
    {
      "timestamp": "2024-11-20T...",
      "level": "error",
      "message": "booking failed",
      "trace_id": "abc123...",
      "span_id": "span456...",
      "service.name": "habita-web",
      ...custom_fields
    }
    ```
  - For `error()`: Also record exception to current span
    - `span.recordException(error)`
    - `span.setStatus({ code: SpanStatusCode.ERROR })`
  - Output to stdout (OTel collector will scrape it)

- [x] **Replace console.log in core infrastructure**
  - [x] `db/query_builder.ts` → `logger.info()` / `logger.error()`
  - [x] `app/entry.server.tsx` → `logger.error()`
  - [x] `app/lib/cron/process_jobs.server.ts` → `logger.info()` / `logger.error()`
  - [x] `app/lib/cron/create_escalation_jobs.server.ts` → `logger.info()`
  - [x] Cron script files → `logger.info()` / `logger.error()`

---

## Phase 4: Database Instrumentation (Kysely)

- [ ] **Create `/apps/web/db/telemetry_plugin.ts`**

  **Custom Kysely plugin** that implements `KyselyPlugin` interface:

  **In `transformQuery()`**:
  - Start a span: `tracer.startActiveSpan("db.query")`
    - **IMPORTANT**: Use `startActiveSpan()` NOT `startSpan()`
    - This makes the database span a CHILD of the current loader/action span
    - Enables automatic nesting: loader → query
  - Extract operation type (SELECT, INSERT, UPDATE, DELETE) from query
  - Extract table name from query
  - Set span name: `"SELECT properties"` or `"INSERT bookings"`
  - Add attributes:
    - `db.system` = "postgresql"
    - `db.statement` = SQL query string (or sanitized version)
    - `db.operation` = operation type
    - `db.sql.table` = table name
    - Store span in query metadata for later

  **In `transformResult()`**:
  - Retrieve span from query metadata
  - Add result attributes:
    - `db.rows_affected` = number of rows
    - `db.duration_ms` = query duration
  - If error occurred:
    - `span.recordException(error)`
    - `span.setStatus({ code: SpanStatusCode.ERROR })`
  - End the span: `span.end()`

  **How span nesting works**:
  ```typescript
  // In loader/action
  tracer.startActiveSpan('loader /route', async (span) => {
    // ↓ This query span automatically becomes a CHILD
    const data = await db.selectFrom('users').execute()
    //              ↑ Kysely plugin creates child span here
  })
  ```

  **Result in SigNoz**:
  ```
  loader /properties/:id (parent)
  └── SELECT properties WHERE id = ? (child)
  ```

  **When a query errors, you see the full context**:
  ```
  action /bookings/create (ERROR)
  ├── auth.require_auth (OK)
  ├── validation.booking_form (OK)
  ├── INSERT bookings (ERROR) ← Database constraint violation
  │   error: "duplicate key value violates unique constraint"
  └── [stopped here due to error]
  ```
  You can see EXACTLY which action, which query, and full error details!

- [ ] **Update `/apps/web/db/query_builder.ts`**
  - Add `TelemetryPlugin` to plugins array
  - Remove existing `log()` callback (replaced by plugin + logger)
  - Keep `ParseJSONResultsPlugin`

**What you'll see in SigNoz**:
- Every database query as a span with SQL, duration, table name
- Slow queries easily identifiable
- Failed queries with error context

---

## Phase 5: What to Trace in Loaders

**You'll create your own abstractions**, but here's **what's interesting to trace**:

### 5.1 Core Loader Span

- [ ] **Create span for each loader execution**
  - Span name: `"loader /properties/:id/book"`
  - **CRITICAL**: Use `tracer.startActiveSpan()` to enable automatic nesting
    - All child operations (DB queries, cache, etc.) will automatically nest under this span
    - This is how you see the full request flow in SigNoz
  - Attributes to add:
    - `http.method` = request method
    - `http.url` = request URL pathname
    - `http.route` = route pattern
    - `span.kind` = "server"

### 5.2 Authentication & Authorization

- [ ] **Trace `require_auth()` and `get_auth()`**
  - Create span: `"auth.require_auth"` or `"auth.get_current_user"`
  - Attributes:
    - `auth.method` = "cookie" or "session"
    - `auth.user_id` = user ID (after successful auth)
    - `auth.has_session` = true/false
  - If auth fails: record error to span

  **Why**: See which routes fail auth, how long auth checks take

### 5.3 Data Fetching

- [ ] **Trace complex data fetching operations**
  - For operations like `fetch_property_with_availability()`:
    - Create span: `"data.fetch_property_with_availability"`
    - Attributes:
      - `property.id` = property ID
      - `fetch.includes_availability` = true/false
      - `fetch.includes_images` = true/false
  - Database queries inside will auto-nest as child spans (via Kysely plugin)

  **Why**: See which data fetches are slow, understand query patterns

### 5.4 Cache Operations

- [ ] **Trace Redis/cache lookups**
  - Create spans for cache operations:
    - `"cache.get"`, `"cache.set"`, `"cache.delete"`
  - Attributes:
    - `cache.key` = cache key
    - `cache.hit` = true/false (for gets)
    - `cache.ttl` = TTL in seconds (for sets)

  **Why**: See cache hit rates, understand cache performance

### 5.5 External API Calls

- [ ] **Trace calls to external services**
  - Nominatim (geocoding): span `"http.get nominatim"`
  - Imgproxy: span `"http.get imgproxy"`
  - Attributes:
    - `http.url` = full URL
    - `http.status_code` = response status
    - `http.response_size` = response size in bytes

  **Why**: See external service latency, track failures

### 5.6 Business Logic

- [ ] **Trace important business operations**
  - Examples:
    - `"business.calculate_booking_price"` - price calculation
    - `"business.check_availability"` - availability checks
    - `"business.validate_booking_dates"` - validation logic
  - Attributes:
    - Operation-specific fields (price, dates, property_id, etc.)

  **Why**: Understand which business logic is slow, debug calculation errors

**Example loader with tracing** (you'll create your own structure):
```typescript
export async function loader({ request, params }: Route.LoaderArgs) {
  const tracer = get_tracer()

  return tracer.startActiveSpan('loader /properties/:id', async (span) => {
    span.setAttribute('http.route', '/properties/:id')
    span.setAttribute('http.url', request.url)

    // Auth (creates child span)
    const { user } = await require_auth(request)
    span.setAttribute('user.id', user.id)

    // Fetch data (creates child spans via Kysely plugin)
    const property = await fetch_property(params.id)

    logger.info("property loaded", { property_id: property.id, user_id: user.id })

    span.end()
    return { property }
  })
}
```

---

## Phase 6: What to Trace in Actions

### 6.1 Core Action Span

- [ ] **Create span for each action execution**
  - Span name: `"action /properties/:id/book"`
  - **CRITICAL**: Use `tracer.startActiveSpan()` to enable automatic nesting
    - All child operations (DB mutations, email sends, etc.) will automatically nest
    - When action errors, you see the FULL flow that led to the error
  - Attributes:
    - `http.method` = "POST"
    - `http.route` = route pattern
    - `action.intent` = intent from form data (if using INTENT pattern)
    - `action.form_keys` = form data keys (NOT values for privacy)

### 6.2 Form Validation

- [ ] **Trace validation operations**
  - Create span: `"validation.booking_form"`
  - Attributes:
    - `validation.schema` = schema name
    - `validation.success` = true/false
    - `validation.error_count` = number of errors
    - `validation.fields` = fields validated
  - If validation fails:
    - Add error details as attributes
    - Don't record as exception (it's expected behavior)

  **Why**: See which forms fail validation most, understand user errors

### 6.3 Data Mutations

- [ ] **Trace important database mutations**
  - Examples:
    - `"mutation.create_booking"` - booking creation
    - `"mutation.update_property"` - property updates
    - `"mutation.invite_owner"` - owner invitations
  - Attributes:
    - Entity IDs (booking_id, property_id, user_id)
    - Operation result (success/failure)
  - Database queries inside will auto-nest (via Kysely plugin)

  **Why**: Track mutation performance, debug failed operations

### 6.4 Email/Notifications

- [ ] **Trace email sending to Go service**
  - Create span: `"http.post /send-email"`
  - Attributes:
    - `http.url` = "http://go:8081/send-email"
    - `email.type` = "booking_confirmation" or "owner_invite"
    - `email.recipient_count` = number of recipients
    - **IMPORTANT**: Inject trace context into headers!
      ```typescript
      import { propagation, context } from '@opentelemetry/api'

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      propagation.inject(context.active(), headers)  // Adds traceparent header

      await fetch('http://go:8081/send-email', { headers, body })
      ```

  **Why**: See end-to-end trace (web → go → smtp), debug email failures

### 6.5 File Operations

- [ ] **Trace image uploads/processing**
  - Create span: `"file.upload_image"`
  - Attributes:
    - `file.size` = file size in bytes
    - `file.type` = MIME type
    - `file.name` = sanitized filename
    - `imgproxy.url` = generated imgproxy URL

  **Why**: Track upload performance, debug image processing issues

### 6.6 Error Handling

- [ ] **Record errors properly in actions**
  - When catching errors in try/catch:
    - Call `logger.error()` with error object (will record to span + log)
    - Add business context as fields
  - Example:
    ```typescript
    try {
      await create_booking(data)
    } catch (error) {
      logger.error("booking creation failed", {
        property_id: data.property_id,
        check_in: data.check_in,
        action: "create_booking"
      }, error as Error)
      return { error: "Booking failed" }
    }
    ```

  **Why**: Full error context in traces, easy debugging

**Example action with tracing** (you'll create your own structure):
```typescript
export async function action({ request, params }: Route.ActionArgs) {
  const tracer = get_tracer()

  return tracer.startActiveSpan('action /properties/:id/book', async (span) => {
    span.setAttribute('http.route', '/properties/:id/book')

    const form_data = await request.formData()
    span.setAttribute('action.intent', String(form_data.get('intent')))

    try {
      // Validation (create child span)
      const validated = await validate_booking_form(form_data)

      // Create booking (creates child spans via Kysely)
      const booking = await create_booking(validated)
      span.setAttribute('booking.id', booking.id)

      // Send email (creates child span, propagates trace to Go)
      await send_booking_email(booking)

      logger.info("booking created", { booking_id: booking.id })

      span.end()
      return redirect(`/bookings/${booking.id}`)
    } catch (error) {
      logger.error("booking failed", { property_id: params.id }, error as Error)
      span.end()
      return { error: "Booking failed" }
    }
  })
}
```

---

## Phase 7: Create Trace Utilities

- [ ] **Create `/apps/web/app/lib/telemetry/trace.server.ts`**

  **Utilities to export** (you decide the API):
  - `get_tracer()` - Get tracer instance
  - `get_current_span()` - Get active span
  - `add_span_attribute(key, value)` - Add attribute to current span
  - Helper for starting spans (your design)
  - Helper for context propagation (for Go service calls)

  **Do NOT create abstractions for loaders/actions yet** - you'll design those yourself after seeing patterns

---

## Phase 8: Redis Instrumentation

- [ ] **Wrap Redis operations in `/apps/web/app/lib/kv.server.ts`**

  **Operations to trace**:
  - `get()` - Cache retrieval
  - `set()` - Cache storage
  - `delete()` - Cache invalidation
  - `exists()` - Cache check

  **Span attributes**:
  - `db.system` = "redis"
  - `db.operation` = operation type (get, set, delete)
  - `db.redis.key` = cache key
  - `cache.hit` = true/false (for get operations)
  - `cache.ttl` = TTL in seconds (for set operations)

  **Why**: Understand cache behavior, find missing cache hits

---

## Phase 9: Replace console.log in Route Files

- [ ] **Replace console.log in route action/loader files**
  - Search all route files for console.log/error/warn
  - Replace with appropriate logger calls
  - Add contextual fields (user_id, property_id, etc.)
  - Note: This phase touches many files and should be done carefully

---

## Phase 11: Go Service Instrumentation

### 10.1 Install Dependencies

- [ ] **Install Go OTel packages**
  ```bash
  go get go.opentelemetry.io/otel
  go get go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp
  go get go.opentelemetry.io/otel/sdk/trace
  go get go.opentelemetry.io/otel/sdk/resource
  go get go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp
  go get go.opentelemetry.io/otel/semconv/v1.24.0
  ```

### 10.2 Core Setup

- [ ] **Create `/apps/go/internal/observability/otel.go`**
  - Initialize OTel SDK similar to TypeScript version
  - Create OTLP HTTP exporter → `otel-collector:4318`
  - Configure resource:
    - `service.name` = "habita-go"
    - `service.version` = from build
    - `deployment.environment` = from env
  - Return TracerProvider
  - Export `InitOTel()` function

- [ ] **Create `/apps/go/internal/observability/logger.go`**

  **Logger API (matching TypeScript)**:
  ```go
  type Logger struct {}

  func (l *Logger) Info(ctx context.Context, msg string, fields map[string]any)
  func (l *Logger) Warn(ctx context.Context, msg string, fields map[string]any)
  func (l *Logger) Error(ctx context.Context, msg string, fields map[string]any)

  func NewLogger() *Logger
  ```

  **Implementation**:
  - Wrap `log/slog` JSONHandler
  - Create custom handler that:
    - Extracts trace context from `context.Context`
    - Adds `trace_id` and `span_id` to log record
    - Outputs to stdout as JSON
  - For `Error()`: Also record exception to current span (if exists)

### 10.3 HTTP Handler Instrumentation

- [ ] **Update `/apps/go/cmd/server/main.go`**
  - Initialize OTel: `tp := observability.InitOTel()`
  - Defer shutdown: `defer tp.Shutdown(context.Background())`
  - Create logger: `logger := observability.NewLogger()`
  - Wrap HTTP handlers with `otelhttp.NewHandler()`:
    ```go
    http.Handle("/send-email",
      otelhttp.NewHandler(
        http.HandlerFunc(smtp.Handler(logger)),
        "send-email",
      ),
    )
    ```
  - **KEY**: `otelhttp.NewHandler()` automatically:
    - Creates span for incoming request
    - Extracts `traceparent` header from web app
    - Links this span to web app's trace!

### 10.4 SMTP Operation Tracing

- [ ] **Update `/apps/go/internal/smtp/smtp.go`**

  **What to trace in `SendCalendarInvite()`**:
  - Create span: `"smtp.send_calendar_invite"`
  - Attributes:
    - `email.to` = recipient email
    - `email.subject` = email subject
    - `smtp.host` = SMTP server host
    - `smtp.port` = SMTP server port
  - Create sub-spans for each SMTP operation:
    - `"smtp.connect"` - TCP connection
    - `"smtp.starttls"` - TLS negotiation
    - `"smtp.auth"` - Authentication
    - `"smtp.send"` - Sending email
  - Log important events:
    ```go
    logger.Info(ctx, "sending email", map[string]any{
      "recipient": req.Visitant,
      "subject": req.Subject,
    })
    ```
  - If error occurs:
    - `span.RecordError(err)`
    - `span.SetStatus(codes.Error, err.Error())`
    - `logger.Error(ctx, "smtp failed", map[string]any{"error": err.Error()})`

  **What to trace in `SendOwnerInvite()`**:
  - Same pattern as above
  - Span name: `"smtp.send_owner_invite"`

### 10.5 Update Handlers

- [ ] **Update HTTP handlers to accept logger and pass context**
  ```go
  func Handler(logger *observability.Logger) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
      ctx := r.Context()  // Contains trace context from otelhttp!

      // Decode request...

      if err := SendCalendarInvite(ctx, logger, req); err != nil {
        logger.Error(ctx, "email send failed", map[string]any{"error": err.Error()})
        http.Error(w, err.Error(), 500)
        return
      }

      logger.Info(ctx, "email sent successfully", map[string]any{"recipient": req.Visitant})
      w.WriteHeader(200)
    }
  }
  ```

---

## Phase 11: Testing & Validation

### 10.1 Infrastructure

- [ ] **Start services**
  ```bash
  cd infra/development
  docker compose up -d
  ```

- [ ] **Access SigNoz**
  - Open http://localhost:3301
  - Create account / sign in
  - Verify empty dashboard loads

### 10.2 Basic Tracing

- [ ] **Test 1: Simple page load**
  - Navigate to any page in the app
  - Check SigNoz → Services tab → see "habita-web"
  - Click through to traces → see loader span
  - Verify span has attributes (http.route, http.url)

- [ ] **Test 2: Database queries**
  - Load a page that queries database (e.g., property list)
  - Check SigNoz → see trace with:
    - Loader span (parent)
    - Database query spans (children)
  - Click database span → verify SQL is visible
  - Check query duration

- [ ] **Test 3: Multiple nested operations**
  - Load a complex page (e.g., property details with availability)
  - Check SigNoz → see trace with:
    - Loader span
    - Auth check span
    - Multiple database queries
    - Cache lookups (if implemented)
  - Verify all spans are nested correctly

### 10.3 Error Tracking

- [ ] **Test 4: Trigger validation error**
  - Submit invalid form data
  - Check SigNoz → Exceptions tab
  - Verify error appears
  - Click error → see full trace showing:
    - What user tried to do
    - Where validation failed
    - Form data keys

- [ ] **Test 5: Database error**
  - Trigger a database constraint violation
  - Check SigNoz → see error in trace
  - Verify error details include SQL query
  - Check logs are correlated

### 10.4 Cross-Service Tracing (THE BIG TEST)

- [ ] **Test 6: End-to-end booking flow**
  - Create a booking that triggers email send
  - Check SigNoz → find the trace
  - Verify SINGLE trace shows:
    1. Action span (habita-web)
    2. HTTP call to Go service span (habita-web)
    3. HTTP handler span (habita-go) ← Same trace_id!
    4. SMTP send span (habita-go)
  - Click through each span → verify context
  - Check that all spans have same trace_id

- [ ] **Test 7: Email failure**
  - Trigger SMTP failure (wrong credentials, etc.)
  - Check SigNoz → see error in Go service span
  - Verify error propagates back to web app
  - Verify logs from both services are correlated

### 10.5 Log Correlation

- [ ] **Test 8: Find logs from trace**
  - Find any trace in SigNoz
  - Look for logs in trace detail view
  - Verify logs have matching trace_id
  - Click log → should show trace context

- [ ] **Test 9: Find trace from log**
  - Go to SigNoz Logs view
  - Find any error log
  - Check it has trace_id field
  - Click trace_id → jumps to full trace

### 10.6 Performance Analysis

- [ ] **Test 10: Identify slow queries**
  - Generate some traffic
  - Go to SigNoz → find slowest database queries
  - Verify you can see:
    - SQL statement
    - Duration
    - Which route/action called it
    - Full trace context

- [ ] **Test 11: Service dependency graph**
  - Check SigNoz → Service Map or Dependencies
  - Verify it shows:
    - habita-web → PostgreSQL
    - habita-web → Redis
    - habita-web → habita-go
    - habita-go → SMTP (external)

---

## Phase 11: Documentation & Cleanup

- [ ] **Create `/docs/observability.md`**
  - How to access SigNoz
  - How to find traces for specific requests
  - How to debug errors using traces
  - How to add custom spans (examples)
  - How to use logger in TS and Go (side-by-side)

- [ ] **Update `.env.template`**
  - Add all OTEL_* variables with comments
  - Document required vs optional variables

- [ ] **Clean up old logging**
  - Remove any remaining console.log statements
  - Ensure all errors are logged via logger
  - Verify no duplicate logging

---

## Success Criteria

After completion, you should be able to:

✅ See all HTTP requests traced in SigNoz
✅ See all database queries with SQL and timing
✅ See errors with full context (what happened before/after)
✅ Follow a request from web app → Go service → SMTP
✅ Find logs associated with any trace
✅ Identify slow operations quickly
✅ Debug production issues in minutes instead of hours

---

## What Makes Good Traces?

**Good span names**:
- ✅ `loader /properties/:id/book` - clear operation + route
- ✅ `auth.require_auth` - clear subsystem + operation
- ✅ `db.SELECT.properties` - clear operation + table
- ❌ `function_123` - meaningless
- ❌ `handler` - too generic

**Good attributes**:
- ✅ Business context: `user.id`, `property.id`, `booking.id`
- ✅ Technical context: `http.status_code`, `db.statement`, `cache.hit`
- ✅ Error context: `error.type`, `error.message`
- ❌ Sensitive data: passwords, credit cards, PII
- ❌ Large payloads: don't dump entire request/response bodies

**Good error handling**:
- ✅ Record exception to span: `span.recordException(error)`
- ✅ Set span status: `span.setStatus({ code: ERROR })`
- ✅ Log with context: `logger.error("operation failed", context, error)`
- ✅ Add business context: which user, what resource, what operation
- ❌ Silent failures (no logging, no span recording)
- ❌ Generic errors ("something went wrong")

---

## Notes

- Start simple, add more instrumentation as you see patterns
- Don't trace everything - focus on interesting operations
- Span overhead is ~50-100μs, don't worry about performance
- Use semantic conventions where they exist (http.*, db.*, etc.)
- You'll design your own loader/action abstractions after seeing patterns
- Logger.error() does both logging AND span recording (one function)
