# Error handling

This codebase uses Go-style error handling. Functions never throw — they return `[error, result]` tuples. Callers match on error types to decide what to do.

## Core primitives

### `safe_async` (`$lib/safe_async.ts`)

Wraps any `Promise<T>` into a tuple. Catches thrown errors.

```ts
const [error, data] = await safe_async(fetch("..."))
// error: Error | null
// data: T | null
```

### `safe_sync` (`$lib/safe_sync.ts`)

Same pattern for synchronous code that might throw.

```ts
const [error, parsed] = safe_sync(() => JSON.parse(raw))
```

Both return plain `Error` — they don't know about typed errors. Typed errors are added by the utility functions that wrap `safe_async`/`safe_sync`.

## Typed errors

Utility functions don't return raw `Error`. They return `{ type, error }` so callers can match on the failure reason.

### Defining error constants and type

Everything lives in the same file as the utility function — no separate `_error.ts` files. Use `as const` + `ObjectValues` from `$lib/compose_types.ts`. Numeric values, SCREAMING_SNAKE keys. The error type uses the same name as the values union (no `Typed` suffix):

```ts
import type { ObjectValues } from "$lib/compose_types"

// NOTE: newly added error
export const SEND_EMAIL_ERROR = {
  FETCH_FAILED: 0,
  SERVICE_ERROR: 1,
} as const

export type SendEmailError = {
  type: ObjectValues<typeof SEND_EMAIL_ERROR>
  error: Error
}
```

The constant, type, and utility function all live together in one file (e.g. `$lib/server/send_email.ts`).

### Return type signature

```ts
export async function send_email(
  body: object,
): Promise<[SendEmailError, null] | [null, null]> {
```

When the function returns data on success:

```ts
export async function generate_pdf_with_playwright(
  html: string,
): Promise<[GeneratePdfWithPlaywrightError, null] | [null, Buffer]> {
```

### Returning errors from utilities

Each error site wraps with `{ type, error }` and logs before returning:

```ts
const [fetch_error, response] = await safe_async(
  fetch("..."),
)
if (fetch_error) {
  logger.error(fetch_error.message, {}, fetch_error)
  return [
    {
      type: SEND_EMAIL_ERROR.FETCH_FAILED,
      error: fetch_error,
    },
    null,
  ]
}
```

## Action error handling

Actions are server-side functions triggered by form submissions. They return Go-style two-element tuples `[errors, data]`, where:

- `errors` — an object keyed by the action name, containing either `input` validation errors or an `execution` error string
- `data` — the return value on success (`null` for void actions, a typed object for data-returning actions)

TypeScript infers the full union type from the function's `return` statements — no need to write the type explicitly.

### Error shape

Every action error is an object with two discriminated channels:

```ts
{
  action_name: {
    input?: v.FlatErrors<typeof InputSchema>  // validation errors from v.flatten
    execution?: string                         // operation failure message (Spanish)
  }
}
```

- **`input`** — returned when `v.safeParse` fails. Uses `v.flatten(result.issues)` which produces `{ root?: string[], nested?: Record<string, string[]> }`. Shows ALL validation errors per field.
- **`execution`** — returned when a database query, API call, or any operation fails after validation.

These two channels are mutually exclusive per return — a single return is either an input error or an execution error, never both.

### Inside the action

Every action follows this three-step structure:

```ts
import * as v from "valibot"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"

const InputSchema = v.object({
  id: ForceNumberSchema,
  name: v.pipe(
    v.string(),
    v.minLength(1, "El nombre es requerido"),
  ),
  surname: v.pipe(
    v.string(),
    v.minLength(1, "El apellido es requerido"),
  ),
})

export async function update_thing(form_data: FormData) {
  // 1. Validate input — v.safeParse, NOT v.parse
  const result = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!result.success) {
    return [
      { update_thing: { input: v.flatten(result.issues) } },
      null,
    ] as const
  }
  const input = result.output

  // 2. Execute operation — safe_async
  const [error] = await safe_async(
    query_builder
      .updateTable("thing")
      .set({
        name: input.name,
        surname: input.surname,
        updated_at: now,
      })
      .where("thing.id", "=", input.id)
      .execute(),
  )
  if (error) {
    logger.error(error.message, {}, error)
    return [
      {
        update_thing: { execution: "Error al actualizar" },
      },
      null,
    ] as const
  }

  // 3. Success
  return [null, null] as const
}
```

### Data-returning actions

When an action produces data on success, the second tuple element carries it:

```ts
export async function create_pdf(
  form_data: FormData,
  property_id: number,
) {
  const result = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!result.success) {
    return [
      { create_pdf: { input: v.flatten(result.issues) } },
      null,
    ] as const
  }

  const [error, content] =
    await generate_pdf_with_playwright(html)
  if (error) {
    if (
      error.type ===
      GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.FETCH_FAILED
    ) {
      return [
        {
          create_pdf: {
            execution:
              "No se pudo conectar al servicio de PDF",
          },
        },
        null,
      ] as const
    }
    return [
      {
        create_pdf: {
          execution: "Error al generar el PDF",
        },
      },
      null,
    ] as const
  }

  // Success with data
  return [null, { content }] as const
}
```

### Actions without FormData input

Some actions don't receive user input — they operate on pre-validated parameters. These skip the `v.safeParse` step and only have `execution` errors:

```ts
export async function create_room(property_id: number) {
  const [error] = await safe_async(
    query_builder
      .insertInto("room")
      .values({
        property_id,
        created_at: now,
        updated_at: now,
      })
      .execute(),
  )
  if (error) {
    logger.error(error.message, {}, error)
    return [
      {
        create_room: {
          execution: "Error al crear la habitación",
        },
      },
      null,
    ] as const
  }
  return [null, null] as const
}
```

### Actions with sequential operations

When an action performs multiple operations, wrap them in a transaction — all succeed or all fail. Use the `tx` handle instead of `query_builder` inside the transaction. Destructure both tuple elements from `safe_async` when a later operation needs data from an earlier one:

```ts
import * as v from "valibot"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"
import { ForceNumberSchema } from "$lib/force_number"

const InputSchema = v.object({
  contract_id: ForceNumberSchema,
  name: v.pipe(
    v.string(),
    v.minLength(1, "El nombre es requerido"),
  ),
  income: ForceNumberSchema,
})

export async function add_income_guarantor(
  form_data: FormData,
) {
  const result = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!result.success) {
    return [
      {
        add_income_guarantor: {
          input: v.flatten(result.issues),
        },
      },
      null,
    ] as const
  }
  const input = result.output

  const [error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      // First operation — need the returned id
      const guarantor = await tx
        .insertInto("income_guarantor")
        .values({
          name: input.name,
          income: input.income,
          created_at: now,
          updated_at: now,
        })
        .returning("id")
        .executeTakeFirstOrThrow()

      // Second operation — uses guarantor.id from above
      await tx
        .insertInto("contract_income_guarantor")
        .values({
          contract_id: input.contract_id,
          income_guarantor_id: guarantor.id,
          created_at: now,
        })
        .execute()
    }),
  )
  if (error) {
    logger.error(error.message, {}, error)
    return [
      {
        add_income_guarantor: {
          execution: "Error al crear el garante",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
```

If any operation inside the transaction throws, Kysely rolls back automatically — no orphaned rows.

### Actions with loops

When an action operates on a list of items, wrap the loop in a transaction — all items update or none do:

```ts
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"

export async function update_room_positions(
  property_id: number,
  positions: Array<{ room_id: number; position: number }>,
) {
  const [error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      for (const { room_id, position } of positions) {
        await tx
          .insertInto("room")
          .values({
            id: room_id,
            property_id,
            position,
            created_at: now,
            updated_at: now,
          })
          .onConflict((oc) =>
            oc
              .column("id")
              .doUpdateSet({ position, updated_at: now }),
          )
          .execute()
      }
    }),
  )
  if (error) {
    logger.error(error.message, {}, error)
    return [
      {
        update_room_positions: {
          execution: "Error al actualizar las posiciones",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
```

### Rule: sequential or loop = transaction

If an action has more than one database operation (sequential steps or loop iterations), it must be wrapped in a transaction. All succeed or all fail. No exceptions.

### Actions calling typed-error utilities

When an action calls a utility that returns typed errors (e.g. `generate_pdf_with_playwright`, `send_email`), match each error type and map it to an `execution` string:

```ts
const [pdf_error, content] =
  await generate_pdf_with_playwright(html)
if (pdf_error) {
  if (
    pdf_error.type ===
    GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.FETCH_FAILED
  ) {
    return [
      {
        create_pdf: {
          execution:
            "No se pudo conectar al servicio de PDF",
        },
      },
      null,
    ] as const
  }
  if (
    pdf_error.type ===
    GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.SERVICE_ERROR
  ) {
    return [
      {
        create_pdf: {
          execution:
            "Error en el servicio de generación de PDF",
        },
      },
      null,
    ] as const
  }
  if (
    pdf_error.type ===
    GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.BUFFER_READ_FAILED
  ) {
    return [
      {
        create_pdf: {
          execution:
            "Error al leer el contenido del PDF generado",
        },
      },
      null,
    ] as const
  }
  return [
    {
      create_pdf: { execution: "Error al generar el PDF" },
    },
    null,
  ] as const
}
```

Always include a fallback return after all if-branches for forward-compatibility when new error types are added.

### Actions with multiple input shapes

When a concept has multiple shapes (e.g. different warranty types), create one action per shape. Each action has its own clean `v.object` InputSchema. The caller reads the discriminant from `FormData` and dispatches to the correct function.

**Actions** — each owns its own `v.object`:

```ts
// create_salary_warranty.server.ts
const InputSchema = v.object({
  employer: v.pipe(v.string(), v.minLength(1, "Requerido")),
  salary: ForceNumberSchema,
})

export async function create_salary_warranty(
  form_data: FormData,
) {
  const result = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!result.success) {
    return [
      {
        create_warranty: {
          input: v.flatten(result.issues),
        },
      },
      null,
    ] as const
  }
  // ... insert salary warranty
  return [null, null] as const
}
```

```ts
// create_property_warranty.server.ts
const InputSchema = v.object({
  property_address: v.pipe(
    v.string(),
    v.minLength(1, "Requerido"),
  ),
})

export async function create_property_warranty(
  form_data: FormData,
) {
  const result = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!result.success) {
    return [
      {
        create_warranty: {
          input: v.flatten(result.issues),
        },
      },
      null,
    ] as const
  }
  // ... insert property warranty
  return [null, null] as const
}
```

**Caller** — reads the type and dispatches:

```ts
[ACTION.CREATE_WARRANTY]: async ({ request, locals, params }) => {
  // ... auth, access checks
  const form_data = await request.formData()
  const warranty_type = v.parse(v.picklist(["salary", "property"]), form_data.get("warranty_type"))

  switch (warranty_type) {
    case "salary": {
      const [errors] = await create_salary_warranty(form_data)
      if (errors) return { errors }
      return null
    }
    case "property": {
      const [errors] = await create_property_warranty(form_data)
      if (errors) return { errors }
      return null
    }
  }
}
```

All actions share the same error key (`create_warranty`) so the template only checks one key.

## Caller patterns

Every `+page.server.ts` action handler follows the same explicit pattern: destructure the tuple, check for errors, wrap in `{ errors }` for SvelteKit, and decide what to do on success.

The action never wraps in `{ errors }` — it only produces the error payload. The caller wraps it.

### Standard caller (void action)

```ts
const [update_thing_errors] = await update_thing(form_data)
if (update_thing_errors) {
  return { errors: update_thing_errors }
}
return null
```

### Data-returning caller

```ts
const [create_pdf_errors, pdf_data] = await create_pdf(
  form_data,
  property_id,
)
if (create_pdf_errors) {
  return { errors: create_pdf_errors }
}
// use pdf_data.content...
return null
```

### Redirect caller

```ts
const [set_date_errors, date_result] = await set_date(
  url,
  form_data,
)
if (set_date_errors) {
  return { errors: set_date_errors }
}
redirect(302, date_result.redirect_url)
```

### Full `+page.server.ts` example

```ts
import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_edit_access } from "$lib/server/property_access"
import { update_location } from "./actions/update_location.server"
import { create_room } from "./actions/create_room.server"
import { ACTION } from "./actions/action"
import type { Actions } from "./$types"

export const actions: Actions = {
  [ACTION.UPDATE_LOCATION]: async ({
    request,
    locals,
    params,
  }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const form_data = await request.formData()
    const [update_location_errors] =
      await update_location(form_data)
    if (update_location_errors) {
      return { errors: update_location_errors }
    }
    return null
  },
  [ACTION.CREATE_ROOM]: async ({
    request,
    locals,
    params,
  }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const [create_room_errors] =
      await create_room(property_id)
    if (create_room_errors) {
      return { errors: create_room_errors }
    }
    return null
  },
}
```

No try-catch. No `execute`/`get_errors` pattern. The action owns all error handling internally.

## Template patterns

### `has_action_error` utility (`$lib/has_action_error.ts`)

Type predicate that narrows the SvelteKit `form` prop to the error shape. Hides the `in` keyword from templates.

```ts
import type * as v from "valibot"

type ActionError = {
  input?: v.FlatErrors<undefined>
  execution?: string
}

export function has_action_error<K extends string>(
  form: unknown,
  key: K,
): form is { errors: Record<K, ActionError> } {
  if (!form || typeof form !== "object") return false
  if (!("errors" in form)) return false
  const { errors } = form
  if (!errors || typeof errors !== "object") return false
  return key in errors
}
```

### Displaying input validation errors

`v.flatten` returns `{ root?: string[], nested?: Record<string, string[]> }`. Iterate the arrays to show ALL errors per field:

```svelte
{#if has_action_error(form, "update_user")}
  <!-- Per-field errors from v.flatten nested -->
  {#each form.errors.update_user.input?.nested?.name ?? [] as error}
    <Formulary.Error>{error}</Formulary.Error>
  {/each}

  {#each form.errors.update_user.input?.nested?.surname ?? [] as error}
    <Formulary.Error>{error}</Formulary.Error>
  {/each}
{/if}
```

### Displaying execution errors

```svelte
{#if has_action_error(form, "update_user")}
  {#if form.errors.update_user.execution}
    <Formulary.Error
      >{form.errors.update_user.execution}</Formulary.Error
    >
  {/if}
{/if}
```

### Combined example

A typical form section handles both channels:

```svelte
<Formulary.Field>
  <Formulary.Label for="name">Nombre</Formulary.Label>
  <Formulary.Input
    name="name"
    value={data.user_profile.name}
  />
  {#if has_action_error(form, "update_user")}
    {#each form.errors.update_user.input?.nested?.name ?? [] as error}
      <Formulary.Error>{error}</Formulary.Error>
    {/each}
  {/if}
</Formulary.Field>

<!-- Execution error at the form level -->
{#if has_action_error(form, "update_user")}
  {#if form.errors.update_user.execution}
    <Formulary.Error
      >{form.errors.update_user.execution}</Formulary.Error
    >
  {/if}
{/if}
```

## Loaders (`+page.server.ts` load functions)

Use SvelteKit's `error()` helper with the appropriate status code. Loader errors are expected situations (missing records, bad params) — never use 500:

```ts
import { error } from "@sveltejs/kit"

// Missing record
if (!property) {
  error(404, "Propiedad no encontrada")
}

// Invalid params
if (!valid_state) {
  error(400, "Estado inválido")
}
```

## API routes / webhooks (`+server.ts`)

Log the error and return an HTTP response. No typed error wrapper needed since these are final consumers.

```ts
if (signed_document_error) {
  if (
    signed_document_error.type ===
    API_FETCH_ERROR.FETCH_FAILED
  ) {
    logger.error(
      signed_document_error.error.message,
      {
        contract_id,
        error_type: API_FETCH_ERROR.FETCH_FAILED,
      },
      signed_document_error.error,
    )
  }
  // ... other types
  redirect(302, "/digital_signature/error")
}
```

## Non-critical side effects

When the error shouldn't block the main flow (e.g. sending notification emails), log and continue:

```ts
const [email_error] = await send_email({
  to: recipient,
  subject,
  html,
})
if (email_error) {
  if (email_error.type === SEND_EMAIL_ERROR.FETCH_FAILED) {
    logger.error(
      email_error.error.message,
      {
        recipient_email: recipient.email,
        error_type: SEND_EMAIL_ERROR.FETCH_FAILED,
      },
      email_error.error,
    )
  }
  if (email_error.type === SEND_EMAIL_ERROR.SERVICE_ERROR) {
    logger.error(
      email_error.error.message,
      {
        recipient_email: recipient.email,
        error_type: SEND_EMAIL_ERROR.SERVICE_ERROR,
      },
      email_error.error,
    )
  }
}
// execution continues regardless
```

## Client-side error logging

The `logger` from `$lib/telemetry/logger.ts` is isomorphic — same import works on both server and client. On the client, the browser OpenTelemetry SDK (initialized in `hooks.client.ts`) batches logs and sends them through `/api/logger` → otel-collector.

### Unexpected errors (catch-all)

SvelteKit's `handleError` hook in `hooks.client.ts` catches all unhandled client errors — component crashes, runtime exceptions, failed navigations. This is the Sentry-like safety net:

```ts
// hooks.client.ts
import { init_browser_telemetry } from "$lib/telemetry/sdk.client"
import { logger } from "$lib/telemetry/logger"

init_browser_telemetry()

export function handleError({ error, status, message }) {
  const err =
    error instanceof Error ? error : new Error(message)
  logger.error(err.message, { status }, err)
}
```

Every unhandled error on the client goes through here. No error is silently lost.

### Expected errors (explicit)

When client-side code handles an anticipated failure (e.g. a fetch to an external API, a WebSocket disconnect), log it explicitly with context:

```ts
import { logger } from "$lib/telemetry/logger"

const response = await fetch("/api/some-endpoint")
if (!response.ok) {
  logger.error("Failed to fetch endpoint", {
    status: response.status,
    endpoint: "/api/some-endpoint",
  })
}
```

Use `logger.warn` for situations that are notable but not failures:

```ts
logger.warn("Payment status check timed out, will retry", {
  payment_id,
})
```

### Severity guide

| Method         | When                                                                        |
| -------------- | --------------------------------------------------------------------------- |
| `logger.error` | Something broke — unexpected crash or expected operation that failed        |
| `logger.warn`  | Something is off but not broken — timeouts, retries, degraded state         |
| `logger.info`  | Notable event for debugging — user completed a flow, feature flag activated |

## Rules

1. **No `throw`** — utility functions return tuples, never throw.
2. **No `as` assertions** — use Valibot schemas for validation.
3. **No magic strings** — always reference the constant (`SEND_EMAIL_ERROR.FETCH_FAILED`, not `"fetch_failed"`).
4. **Log at the source** — the utility or action that detects the error logs it. Callers may log additional context.
5. **Every if-branch per type** — callers must handle each error variant explicitly, even if the handling is the same.
6. **Fallback return** — after all typed if-branches in actions, include a generic fallback error return.
7. **`v.safeParse` inside actions** — never `v.parse`. Actions own validation internally.
8. **`v.flatten` for input errors** — shows all validation failures, not just the first one.
9. **Explicit caller destructuring** — no `return await action()`. Always destructure, check, wrap in `{ errors }`.
10. **Actions produce payloads, callers wrap** — actions return `[{ action_name: ... }, null]`, callers wrap in `{ errors: ... }`.

## Existing error constants

All constants and types are colocated in the same file as their utility function.

| Constant                             | File                                  | Variants                                                                     |
| ------------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------- |
| `API_FETCH_ERROR`                    | `$lib/server/digital_signature.ts`    | `FETCH_FAILED`, `API_ERROR`, `JSON_PARSE_FAILED`, `SCHEMA_VALIDATION_FAILED` |
| `GENERATE_PDF_WITH_PLAYWRIGHT_ERROR` | `$lib/server/pdf_generator.ts`        | `FETCH_FAILED`, `SERVICE_ERROR`, `BUFFER_READ_FAILED`                        |
| `CREATE_PREFERENCE_ERROR`            | `$lib/server/mercado_pago_payment.ts` | `FETCH_FAILED`, `API_ERROR`, `JSON_PARSE_FAILED`, `SCHEMA_VALIDATION_FAILED` |
| `REQUEST_DEMO_ERROR`                 | `$lib/server/request_demo.ts`         | `FETCH_FAILED`, `SERVICE_ERROR`                                              |
| `SEND_LANDLORD_INVITE_ERROR`         | `$lib/server/invite_landlord.ts`      | `FETCH_FAILED`, `SERVICE_ERROR`                                              |
| `SEND_EMAIL_ERROR`                   | `$lib/server/send_email.ts`           | `FETCH_FAILED`, `SERVICE_ERROR`                                              |
