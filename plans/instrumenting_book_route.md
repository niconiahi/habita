# Exhaustive Instrumentation: /book Route

## Overview

The `/properties/:property_id/book` route handles property visit booking. It has two actions:
1. **set_date** - Simple (just sets query param, no DB changes)
2. **update_slot** - Complex multi-step operation that's prone to failures

We'll exhaustively instrument **update_slot** as it's where bugs happen.

---

## Current Flow Analysis

### update_slot Action Flow

**File**: `/app/routes/properties+/$property_id+/book/actions/server/update_slot.server.ts`

**What it does:**
1. Validates form input (slot_id, visitant_id)
2. Updates slot in DB → marks as RESERVED
3. Fetches host user from DB
4. Fetches visitant user from DB
5. Fetches property details
6. Creates ICS calendar file
7. Sends calendar invite email (calls Go service)

**Where it can fail:**
- ❌ Validation fails (invalid input)
- ❌ Slot already booked (DB constraint or race condition)
- ❌ Host user not found (data integrity issue)
- ❌ Visitant user not found (data integrity issue)
- ❌ Property not found (data integrity issue)
- ❌ Email sending fails (Go service down, SMTP error)

---

## Part 1: Main Action Handler

### 1.1 Instrument Route Action Entry Point

**File**: `/app/routes/properties+/$property_id+/book/_index.tsx`

**Current code:**
```typescript
export async function action({
  request,
  params,
}: Route.ActionArgs) {
  const form_data = await request.formData()
  const intent = form_data.get("intent")
  if (!intent) {
    throw error(400, "intent is required")
  }
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  switch (intent) {
    case INTENT.SET_DATE: {
      try {
        const { redirect_to } =
          await actions.set_date.execute(request, form_data)
        return redirect(redirect_to)
      } catch (error) {
        if (error instanceof v.ValiError) {
          return {
            errors: {
              set_date: actions.set_date.get_errors(error),
            },
          }
        }
      }
    }
    case INTENT.UPDATE_SLOT: {
      try {
        await actions.update_slot.execute(
          form_data,
          property_id,
        )
        return redirect("..")
      } catch (error) {
        if (error instanceof v.ValiError) {
          return {
            errors: {
              update_slot:
                actions.update_slot.get_errors(error),
            },
          }
        }
      }
    }
  }
  return null
}
```

**Instrumented version:**
```typescript
import { trace, SpanStatusCode } from '@opentelemetry/api'
import { logger } from '~/lib/telemetry/log.server'
import { record_span_error } from '~/lib/telemetry/trace.server'

export async function action({
  request,
  params,
}: Route.ActionArgs) {
  const tracer = trace.getTracer('web.action')
  return tracer.startActiveSpan('/properties/:id/book', async (span) => {
    const url = new URL(request.url)
    // aren't these "http" related ones auto instrumented by the plugin?
    span.setAttribute('http.method', 'POST')
    span.setAttribute('http.url', url.pathname)
    span.setAttribute('http.route', '/properties/:property_id/book')
    // i don't like that you have a wrapping try/catch. Just maintain the structure i created, no more no less. Just instrument on top by adding lines. Don't change how it looks
    try {
      const form_data = await request.formData()
      const intent = form_data.get("intent")
      if (!intent) {
        // shouldn't this attribute be a field of the "logger.error"?
        span.setAttribute('error.type', 'missing_intent')
        logger.error('action failed: intent is required', {
          property_id: params.property_id,
        })
        span.end()
        throw error(400, "intent is required")
      }
      span.setAttribute('action.intent', intent)
      const property_id = v.parse(
        ForceNumberSchema,
        params.property_id,
      )
      span.setAttribute('property.id', params.property_id)
      switch (intent) {
        case INTENT.SET_DATE: {
          try {
            const { redirect_to } =
              await actions.set_date.execute(request, form_data)

            logger.info('date set successfully', {
              property_id,
              intent: 'set_date',
            })

            span.end()
            return redirect(redirect_to)
          } catch (error) {
            if (error instanceof v.ValiError) {
              span.setAttribute('validation.failed', true)
              span.setAttribute('validation.error_count', error.issues.length)

              logger.warn('set_date validation failed', {
                property_id,
                error_count: error.issues.length,
              })

              span.end()
              return {
                errors: {
                  set_date: actions.set_date.get_errors(error),
                },
              }
            }
            throw error
          }
        }

        case INTENT.UPDATE_SLOT: {
          try {
            await actions.update_slot.execute(
              form_data,
              property_id,
            )

            logger.info('slot updated successfully', {
              property_id,
              intent: 'update_slot',
            })

            span.end()
            return redirect("..")
          } catch (error) {
            if (error instanceof v.ValiError) {
              span.setAttribute('validation.failed', true)
              span.setAttribute('validation.error_count', error.issues.length)

              logger.warn('update_slot validation failed', {
                property_id,
                error_count: error.issues.length,
                fields: error.issues.map(i => i.path?.[0]?.key).filter(Boolean),
              })

              span.end()
              return {
                errors: {
                  update_slot:
                    actions.update_slot.get_errors(error),
                },
              }
            }

            // Unexpected error
            logger.error('update_slot action failed', {
              property_id,
              intent: 'update_slot',
            }, error as Error)

            span.end()
            throw error
          }
        }
      }

      span.end()
      return null
    } catch (error) {
      record_span_error(span, error as Error)
      span.end()
      throw error
    }
  })
}
```

**What you'll see in SigNoz:**
```
action /properties/:id/book
├── http.method: POST
├── http.route: /properties/:property_id/book
├── property.id: 123
├── action.intent: update_slot
└── [child spans from update_slot.execute below]
```

**If validation fails:**
```
action /properties/:id/book
├── http.method: POST
├── property.id: 123
├── action.intent: update_slot
├── validation.failed: true
├── validation.error_count: 2
└── [returns error response - NOT an exception]
```

---

## Part 2: Core update_slot Action

### 2.1 Instrument update_slot.execute()

**File**: `/app/routes/properties+/$property_id+/book/actions/server/update_slot.server.ts`

**Current code:**
```typescript
async function execute(
  form_data: FormData,
  property_id: number,
) {
  const { visitant_id, id } = v.parse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  const slot = await query_builder
    .updateTable("slot")
    .set({
      visitant_id,
      state: SLOT_STATE.RESERVED,
    })
    .where("slot.id", "=", id)
    .returning([
      "slot.start_date",
      "slot.end_date",
      "slot.host_id",
      "slot.property_id",
      "slot.visitant_id",
    ])
    .executeTakeFirstOrThrow()
  const host = v.parse(
    InviteeSchema,
    await query_builder
      .selectFrom("user")
      .select(["email", "name"])
      .where("id", "=", slot.host_id)
      .executeTakeFirstOrThrow(),
  )
  const visitant = v.parse(
    InviteeSchema,
    await query_builder
      .selectFrom("user")
      .select(["email", "name"])
      .where("id", "=", slot.visitant_id)
      .executeTakeFirstOrThrow(),
  )
  const property = await fetch_property(property_id)
  if (!property) {
    throw new Response("property should exist", {
      status: 404,
    })
  }
  const summary = `Visita a la propiedad ubicada en ${property.location.road} ${property.location.house_number}`
  const content = create_ics({
    start_date: slot.start_date,
    end_date: slot.end_date,
    summary,
    location: display_location(property.location),
    host,
    visitant,
  })

  const text = `Hello ${visitant.name}, ...`

  await send_calendar_invite({
    host: host.email,
    visitant: visitant.email,
    subject: summary,
    text,
    content,
  })
}
```

**Instrumented version:**
```typescript
import { trace } from '@opentelemetry/api'
import { logger } from '~/lib/telemetry/log.server'
import { record_span_error } from '~/lib/telemetry/trace.server'

async function execute(
  form_data: FormData,
  property_id: number,
) {
  const tracer = trace.getTracer('web.action')
  return tracer.startActiveSpan('update_slot', async (span) => {
    span.setAttribute('property.id', property_id)
    try {
      const { visitant_id, id } = v.parse(
        InputSchema,
        normalize_input(form_data, InputSchema),
      )
      span.setAttribute('slot.id', id)
      span.setAttribute('visitant.id', visitant_id)
      logger.info('updating slot', {
        slot_id: id,
        visitant_id,
        property_id,
      })
      const slot = await query_builder
        .updateTable("slot")
        .set({
          visitant_id,
          state: SLOT_STATE.RESERVED,
        })
        .where("slot.id", "=", id)
        .returning([
          "slot.start_date",
          "slot.end_date",
          "slot.host_id",
          "slot.property_id",
          "slot.visitant_id",
        ])
        .executeTakeFirstOrThrow()
      span.setAttribute('slot.start_date', slot.start_date.toISOString())
      span.setAttribute('slot.end_date', slot.end_date.toISOString())
      span.setAttribute('host.id', slot.host_id)
      logger.info('slot updated in database', {
        slot_id: id,
        host_id: slot.host_id,
      })
      const host = v.parse(
        InviteeSchema,
        await query_builder
          .selectFrom("user")
          .select(["email", "name"])
          .where("id", "=", slot.host_id)
          .executeTakeFirstOrThrow(),
      )
      span.setAttribute('host.email', host.email)
      span.setAttribute('host.name', host.name)
      const visitant = v.parse(
        InviteeSchema,
        await query_builder
          .selectFrom("user")
          .select(["email", "name"])
          .where("id", "=", slot.visitant_id)
          .executeTakeFirstOrThrow(),
      )
      span.setAttribute('visitant.email', visitant.email)
      span.setAttribute('visitant.name', visitant.name)
      const property = await fetch_property(property_id)
      if (!property) {
        span.setAttribute('error.type', 'property_not_found')
        logger.error('property not found', {
          property_id,
          slot_id: id,
        })
        span.end()
        throw new Response("property should exist", {
          status: 404,
        })
      }
      span.setAttribute('property.location',
        `${property.location.road} ${property.location.house_number}`
      )
      // don't create more active spans, just use the one for the action. 1 action <> 1 active span
      const { content, summary } = await tracer.startActiveSpan(
        'create_ics',
        async (ics_span) => {
          ics_span.setAttribute('slot.start_date', slot.start_date.toISOString())
          ics_span.setAttribute('slot.end_date', slot.end_date.toISOString())

          const summary = `Visita a la propiedad ubicada en ${property.location.road} ${property.location.house_number}`
          const content = create_ics({
            start_date: slot.start_date,
            end_date: slot.end_date,
            summary,
            location: display_location(property.location),
            host,
            visitant,
          })

          ics_span.setAttribute('ics.summary', summary)
          ics_span.setAttribute('ics.location', display_location(property.location))

          logger.info('ics file created', {
            slot_id: id,
            summary,
          })

          ics_span.end()
          return { content, summary }
        }
      )

      // Step 7: Send email - wrap in span (will call Go service)
      await tracer.startActiveSpan(
        'send_calendar_invite',
        async (email_span) => {
          email_span.setAttribute('email.host', host.email)
          email_span.setAttribute('email.visitant', visitant.email)
          email_span.setAttribute('email.subject', summary)

          const text = `Hello ${visitant.name},

You have been invited to visit the property located at ${property.location.road} ${property.location.house_number}.

Date: ${slot.start_date.toLocaleDateString()}
Time: ${slot.start_date.toLocaleTimeString()} - ${slot.end_date.toLocaleTimeString()}

Please open the attached calendar invitation to add this event to your calendar.

Best regards,
${host.name}`

          try {
            await send_calendar_invite({
              host: host.email,
              visitant: visitant.email,
              subject: summary,
              text,
              content,
            })

            email_span.setAttribute('email.sent', true)

            logger.info('calendar invite sent', {
              slot_id: id,
              host: host.email,
              visitant: visitant.email,
            })

            email_span.end()
          } catch (error) {
            email_span.setAttribute('email.sent', false)

            logger.error('failed to send calendar invite', {
              slot_id: id,
              host: host.email,
              visitant: visitant.email,
            }, error as Error)

            record_span_error(email_span, error as Error)
            email_span.end()
            throw error
          }
        }
      )

      logger.info('slot booking completed', {
        slot_id: id,
        property_id,
        visitant_id,
        host_id: slot.host_id,
      })

      span.end()
    } catch (error) {
      // Log error with full context
      logger.error('update_slot failed', {
        property_id,
        operation: 'update_slot',
      }, error as Error)

      record_span_error(span, error as Error)
      span.end()
      throw error
    }
  })
}
```

---

## Part 3: Email Sending (Cross-Service)

### 3.1 Instrument send_calendar_invite()

**File**: `/app/lib/send_calendar_invite.server.ts` (assumed location)

**Current code** (example):
```typescript
export async function send_calendar_invite(params: {
  host: string
  visitant: string
  subject: string
  text: string
  content: string
}) {
  const response = await fetch('http://go:8081/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`Email service failed: ${response.status}`)
  }
}
```

**Instrumented version:**
```typescript
import { trace, propagation, context } from '@opentelemetry/api'
import { logger } from '~/lib/telemetry/log.server'
import { record_span_error } from '~/lib/telemetry/trace.server'

export async function send_calendar_invite(params: {
  host: string
  visitant: string
  subject: string
  text: string
  content: string
}) {
  const tracer = trace.getTracer('http')

  return tracer.startActiveSpan('http.post go:send-email', async (span) => {
    span.setAttribute('http.method', 'POST')
    span.setAttribute('http.url', 'http://go:8081/send-email')
    span.setAttribute('email.recipient', params.visitant)
    span.setAttribute('email.subject', params.subject)

    try {
      const start_time = Date.now()

      // CRITICAL: Inject trace context into headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      propagation.inject(context.active(), headers)

      const response = await fetch('http://go:8081/send-email', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      })

      const duration = Date.now() - start_time

      span.setAttribute('http.status_code', response.status)
      span.setAttribute('http.duration_ms', duration)

      if (!response.ok) {
        span.setAttribute('error.type', 'http_error')
        span.setAttribute('error.status', response.status)

        logger.error('email service returned error', {
          status: response.status,
          recipient: params.visitant,
          duration_ms: duration,
        })

        span.end()
        throw new Error(`Email service failed: ${response.status}`)
      }

      logger.info('email sent via go service', {
        recipient: params.visitant,
        subject: params.subject,
        duration_ms: duration,
      })

      span.end()
    } catch (error) {
      logger.error('failed to call email service', {
        recipient: params.visitant,
      }, error as Error)

      record_span_error(span, error as Error)
      span.end()
      throw error
    }
  })
}
```

**Why the trace context injection matters:**

The `propagation.inject()` adds a `traceparent` header to the request:
```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

When the Go service receives this header, it extracts the trace context and creates a child span. This links the entire flow across services!

---

## Part 4: What You'll See in SigNoz

### 4.1 Successful Booking Flow

```
action /properties/:id/book (850ms total)
├── http.method: POST
├── http.route: /properties/:property_id/book
├── property.id: 123
├── action.intent: update_slot
└── business.update_slot (820ms)
    ├── slot.id: 456
    ├── visitant.id: 789
    ├── host.id: 111
    ├── visitant.email: visitor@example.com
    ├── host.email: host@example.com
    ├── UPDATE slot WHERE id = ? (35ms) ← Kysely plugin
    ├── SELECT user WHERE id = ? (15ms) ← Kysely plugin (host)
    ├── SELECT user WHERE id = ? (12ms) ← Kysely plugin (visitant)
    ├── SELECT property WHERE id = ? (18ms) ← Kysely plugin
    ├── business.create_ics (5ms)
    │   ├── ics.summary: "Visita a la propiedad..."
    │   └── ics.location: "Main St 123, Buenos Aires"
    └── email.send_calendar_invite (680ms)
        └── http.post go:send-email (675ms)
            ├── http.status_code: 200
            ├── http.duration_ms: 673
            ├── email.recipient: visitor@example.com
            └── [Go service spans below - linked!]
                └── smtp.send (650ms) ← From Go service
                    ├── smtp.host: smtp.gmail.com
                    └── [SMTP operation details]
```

### 4.2 Validation Error (Not a Real Error)

```
action /properties/:id/book (8ms)
├── http.method: POST
├── property.id: 123
├── action.intent: update_slot
├── validation.failed: true
├── validation.error_count: 1
└── [returns error response - user sees form errors]
```

### 4.3 Slot Already Booked (Database Error)

```
action /properties/:id/book (ERROR - 45ms)
├── http.method: POST
├── property.id: 123
├── action.intent: update_slot
└── business.update_slot (ERROR - 38ms)
    ├── slot.id: 456
    ├── visitant.id: 789
    └── UPDATE slot WHERE id = ? (ERROR - 32ms)
        ├── error.type: "unique_violation"
        └── error.message: "slot already reserved"
```

### 4.4 Email Service Failed

```
action /properties/:id/book (ERROR - 550ms)
├── http.method: POST
├── property.id: 123
├── action.intent: update_slot
└── business.update_slot (ERROR - 520ms)
    ├── slot.id: 456
    ├── UPDATE slot WHERE id = ? ✓ (35ms)
    ├── SELECT user WHERE id = ? ✓ (15ms)
    ├── SELECT user WHERE id = ? ✓ (12ms)
    ├── SELECT property WHERE id = ? ✓ (18ms)
    ├── business.create_ics ✓ (5ms)
    └── email.send_calendar_invite (ERROR - 430ms)
        └── http.post go:send-email (ERROR - 425ms)
            ├── http.status_code: 503
            ├── error.type: "http_error"
            └── error.message: "Email service failed: 503"
```

**This is the money shot!** You can see:
- Slot WAS updated (data inconsistency!)
- Email failed to send
- Which step failed
- Why it failed
- Full context

---

## Implementation Checklist

### Core Setup
- [ ] Verify `record_span_error()` exists in `/app/lib/telemetry/trace.server.ts`
- [ ] Verify logger is working
- [ ] Verify Kysely plugin is tracing DB queries

### Files to Modify

#### 1. Route Handler
- [ ] `/app/routes/properties+/$property_id+/book/_index.tsx`
  - [ ] Add imports (trace, logger, record_span_error)
  - [ ] Wrap action in span
  - [ ] Add attributes for intent, property_id
  - [ ] Log validation failures
  - [ ] Log successful operations
  - [ ] Handle errors properly

#### 2. update_slot Action
- [ ] `/app/routes/properties+/$property_id+/book/actions/server/update_slot.server.ts`
  - [ ] Wrap execute() in span
  - [ ] Add attributes for slot_id, visitant_id, etc.
  - [ ] Wrap ICS creation in span
  - [ ] Wrap email sending in span
  - [ ] Log each step
  - [ ] Record errors with full context

#### 3. Email Service
- [ ] `/app/lib/send_calendar_invite.server.ts`
  - [ ] Wrap in span
  - [ ] **CRITICAL**: Inject trace context into headers
  - [ ] Add HTTP attributes
  - [ ] Log success/failure
  - [ ] Record errors

### Testing

- [ ] **Test 1: Successful booking**
  - [ ] Book a slot
  - [ ] Check SigNoz for complete trace
  - [ ] Verify all spans are nested correctly
  - [ ] Verify DB queries are children
  - [ ] Verify email span exists
  - [ ] Check logs are correlated

- [ ] **Test 2: Validation error**
  - [ ] Submit invalid data
  - [ ] Check span shows validation.failed
  - [ ] Verify it's NOT marked as error
  - [ ] Check log shows warning

- [ ] **Test 3: Slot already booked**
  - [ ] Try to book same slot twice
  - [ ] Check error trace
  - [ ] Verify DB error is captured
  - [ ] Check which query failed

- [ ] **Test 4: Email service down**
  - [ ] Stop Go service
  - [ ] Try to book
  - [ ] Check trace shows:
    - Slot WAS updated
    - Email sending failed
    - HTTP error details
  - [ ] Verify error context is complete

- [ ] **Test 5: Cross-service trace**
  - [ ] Book successfully
  - [ ] Find trace in SigNoz
  - [ ] Verify Go service spans are children
  - [ ] Verify same trace_id throughout
  - [ ] Click through each span

---

## Success Criteria

After implementing this, you should be able to:

✅ See complete booking flow in one trace
✅ See exactly which step fails and why
✅ See database queries nested under business operations
✅ See email sending time and success/failure
✅ Follow request from web → Go service → SMTP
✅ Find all logs related to a booking by trace_id
✅ Debug "email didn't send but slot is booked" issues instantly
✅ Identify if issue is DB, email service, or SMTP

---

## What Makes This Exhaustive?

1. **Every step traced** - validation, DB updates, fetching, email
2. **Every error captured** - validation, DB constraints, HTTP errors, SMTP failures
3. **Full context** - who, what, when, why for every operation
4. **Cross-service visibility** - web → go → smtp all in one trace
5. **Business attributes** - slot_id, property_id, user emails, dates
6. **Performance data** - duration of each step
7. **Correlated logs** - every log entry linked to trace

---

## Notes

- This is the template for instrumenting other complex actions
- Don't instrument simple actions (like set_date) this heavily
- Focus on multi-step operations where things can fail
- The trace context propagation is CRITICAL for cross-service tracing
- Database queries are already instrumented via Kysely plugin
- Validation errors are NOT exceptions (don't mark span as error)
- Real errors should always be logged AND recorded to span
