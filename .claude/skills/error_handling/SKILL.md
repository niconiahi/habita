---
name: error_handling
description: Error handling patterns across the entire application. Use when writing actions, utility functions, callers, templates, loaders, API routes, or any code that can fail.
---

Full reference: `apps/web/docs/error_handling.md`

# Core principle

Go-style error handling. Functions never throw — they return `[error, result]` tuples. Callers match on errors to decide what to do.

# Core primitives

## `safe_async` (`$lib/safe_async.ts`)

Wraps any `Promise<T>` into a tuple. Catches thrown errors:

```ts
const [error, data] = await safe_async(fetch("..."))
// error: Error | null
// data: T | null
```

## `safe_sync` (`$lib/safe_sync.ts`)

Same pattern for synchronous code that might throw:

```ts
const [error, parsed] = safe_sync(() => JSON.parse(raw))
```

Both return plain `Error` — they don't know about typed errors. Typed errors are added by the utility functions that wrap them.

# Typed errors (utility functions)

Error constant + type ALWAYS colocated in the same file as the utility function. No separate `_error.ts` files.

## Defining error constants and type

Use `as const` + `ObjectValues` from `$lib/compose_types.ts`. Numeric values, SCREAMING_SNAKE keys. No `Typed` suffix on the type name. The type name matches the function name in PascalCase (e.g. `SendEmailError` for `send_email`):

```ts
import type { ObjectValues } from "$lib/compose_types"

export const SEND_EMAIL_ERROR = {
  FETCH_FAILED: 0,
  SERVICE_ERROR: 1,
} as const

// NOTE: newly added error
export type SendEmailError = {
  type: ObjectValues<typeof SEND_EMAIL_ERROR>
  error: Error
}
```

## Return type signature

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

## Returning errors from utilities

Each error site wraps with `{ type, error }` and logs before returning:

```ts
const [fetch_error, response] = await safe_async(fetch("..."))
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

# Actions

Actions are server-side functions triggered by form submissions. They return two-element tuples `[errors, data]` with `as const`.

## Error shape

Every action error is an object with two discriminated channels:

```ts
{
  action_name: {
    input?: v.FlatErrors<typeof InputSchema>  // validation errors from v.flatten
    execution?: string                         // operation failure message (Spanish)
  }
}
```

- **`input`** — returned when `v.safeParse` fails. Uses `v.flatten(input_validation.issues)` which produces `{ root?: string[], nested?: Record<string, string[]> }`. Shows ALL validation errors per field.
- **`execution`** — returned when a database query, API call, or any operation fails after validation.

These two channels are mutually exclusive per return.

## Input validation

Use `v.safeParse` inside actions, NEVER `v.parse`. Use `v.flatten` for input errors:

```ts
const InputSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "El nombre es requerido")),
})

export async function update_thing(form_data: FormData) {
  const input_validation = v.safeParse(InputSchema, normalize_input(form_data, InputSchema))
  if (!input_validation.success) {
    return [{ update_thing: { input: v.flatten(input_validation.issues) } }, null] as const
  }
  const input = input_validation.output
  // ...
}
```

## Execution errors

Wrap DB operations in `safe_async`. Log before returning:

```ts
const [error] = await safe_async(
  query_builder.updateTable("thing").set({ name: input.name }).execute(),
)
if (error) {
  logger.error(error.message, {}, error)
  return [{ update_thing: { execution: "Error al actualizar" } }, null] as const
}
return [null, null] as const
```

## Data-returning actions

When an action produces data on success, the second tuple element carries it:

```ts
export async function create_pdf(form_data: FormData, property_id: number) {
  const input_validation = v.safeParse(InputSchema, normalize_input(form_data, InputSchema))
  if (!input_validation.success) {
    return [{ create_pdf: { input: v.flatten(input_validation.issues) } }, null] as const
  }

  const [error, content] = await generate_pdf_with_playwright(html)
  if (error) {
    if (error.type === GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.FETCH_FAILED) {
      return [
        { create_pdf: { execution: "No se pudo conectar al servicio de PDF" } },
        null,
      ] as const
    }
    return [
      { create_pdf: { execution: "Error al generar el PDF" } },
      null,
    ] as const
  }

  return [null, { content }] as const
}
```

## Actions without FormData input

Some actions don't receive user input — they operate on pre-validated parameters. Skip `v.safeParse`, only have `execution` errors:

```ts
export async function create_room(property_id: number) {
  const [error] = await safe_async(
    query_builder
      .insertInto("room")
      .values({ property_id, created_at: now, updated_at: now })
      .execute(),
  )
  if (error) {
    logger.error(error.message, {}, error)
    return [{ create_room: { execution: "Error al crear la habitación" } }, null] as const
  }
  return [null, null] as const
}
```

## Sequential operations or loops = transaction

If an action has more than one DB operation (sequential steps or loop iterations), it MUST be wrapped in a transaction. All succeed or all fail. No exceptions.

### Sequential example

```ts
const [transaction_error] = await safe_async(
  query_builder.transaction().execute(async (tx) => {
    const row = await tx.insertInto("foo").returning("id").executeTakeFirstOrThrow()
    await tx.insertInto("bar").values({ foo_id: row.id }).execute()
  }),
)
if (transaction_error) {
  logger.error(transaction_error.message, {}, transaction_error)
  return [{ action_name: { execution: "Error message" } }, null] as const
}
return [null, null] as const
```

### Loop example

```ts
const [transaction_error] = await safe_async(
  query_builder.transaction().execute(async (tx) => {
    for (const { room_id, position } of positions) {
      await tx
        .insertInto("room")
        .values({ id: room_id, property_id, position, created_at: now, updated_at: now })
        .onConflict((oc) =>
          oc.column("id").doUpdateSet({ position, updated_at: now }),
        )
        .execute()
    }
  }),
)
if (transaction_error) {
  logger.error(transaction_error.message, {}, transaction_error)
  return [{ update_room_positions: { execution: "Error al actualizar las posiciones" } }, null] as const
}
return [null, null] as const
```

If any operation inside the transaction throws, Kysely rolls back automatically — no orphaned rows.

## Actions calling typed-error utilities

When an action calls a utility that returns typed errors, match each error type and map to an `execution` string. Always include a fallback return after all if-branches:

```ts
const [pdf_error, content] = await generate_pdf_with_playwright(html)
if (pdf_error) {
  if (pdf_error.type === GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.FETCH_FAILED) {
    return [
      { create_pdf: { execution: "No se pudo conectar al servicio de PDF" } },
      null,
    ] as const
  }
  if (pdf_error.type === GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.SERVICE_ERROR) {
    return [
      { create_pdf: { execution: "Error en el servicio de generación de PDF" } },
      null,
    ] as const
  }
  // Fallback for forward-compatibility
  return [
    { create_pdf: { execution: "Error al generar el PDF" } },
    null,
  ] as const
}
```

## Multiple input shapes

One function per shape. Each has its own `v.object` InputSchema. All actions share the same error key so the template only checks one key.

**Actions** — each owns its own `v.object`:

```ts
// create_salary_warranty.server.ts
const InputSchema = v.object({
  employer: v.pipe(v.string(), v.minLength(1, "Requerido")),
  salary: ForceNumberSchema,
})

export async function create_salary_warranty(form_data: FormData) {
  const input_validation = v.safeParse(InputSchema, normalize_input(form_data, InputSchema))
  if (!input_validation.success) {
    return [{ create_warranty: { input: v.flatten(input_validation.issues) } }, null] as const
  }
  // ... insert salary warranty
  return [null, null] as const
}
```

**Caller** — reads the discriminant and dispatches:

```ts
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
```

# Callers (+page.server.ts)

ALWAYS explicit destructure. Never `return await action()`. Actions produce the error payload. Callers wrap in `{ errors }` for SvelteKit. No try-catch for ValiError — actions own validation internally.

## Standard caller (void action)

```ts
const [update_thing_errors] = await update_thing(form_data)
if (update_thing_errors) {
  return { errors: update_thing_errors }
}
return null
```

## Data-returning caller

```ts
const [create_pdf_errors, pdf_data] = await create_pdf(form_data, property_id)
if (create_pdf_errors) {
  return { errors: create_pdf_errors }
}
// use pdf_data.content...
return null
```

## Redirect caller

```ts
const [set_date_errors, date_result] = await set_date(url, form_data)
if (set_date_errors) {
  return { errors: set_date_errors }
}
redirect(302, date_result.redirect_url)
```

## Full `+page.server.ts` example

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
  [ACTION.UPDATE_LOCATION]: async ({ request, locals, params }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    const property_id = v.parse(ForceNumberSchema, params.property_id)
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const form_data = await request.formData()
    const [update_location_errors] = await update_location(form_data)
    if (update_location_errors) {
      return { errors: update_location_errors }
    }
    return null
  },
  [ACTION.CREATE_ROOM]: async ({ request, locals, params }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    const property_id = v.parse(ForceNumberSchema, params.property_id)
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const [create_room_errors] = await create_room(property_id)
    if (create_room_errors) {
      return { errors: create_room_errors }
    }
    return null
  },
}
```

# Templates

Use `has_action_error()` — never the `in` keyword.

## `has_action_error` utility (`$lib/has_action_error.ts`)

Type predicate that narrows the SvelteKit `form` prop to the error shape:

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

## Displaying input validation errors

`v.flatten` returns `{ root?: string[], nested?: Record<string, string[]> }`. Iterate the arrays to show ALL errors per field:

```svelte
{#if has_action_error(form, "update_user")}
  {#each form.errors.update_user.input?.nested?.name ?? [] as error}
    <Formulary.Error>{error}</Formulary.Error>
  {/each}

  {#each form.errors.update_user.input?.nested?.surname ?? [] as error}
    <Formulary.Error>{error}</Formulary.Error>
  {/each}
{/if}
```

## Displaying execution errors

```svelte
{#if has_action_error(form, "update_user")}
  {#if form.errors.update_user.execution}
    <Formulary.Error>{form.errors.update_user.execution}</Formulary.Error>
  {/if}
{/if}
```

## Combined example

A typical form section handles both channels:

```svelte
<Formulary.Field>
  <Formulary.Label for="name">Nombre</Formulary.Label>
  <Formulary.Input name="name" value={data.user_profile.name} />
  {#if has_action_error(form, "update_user")}
    {#each form.errors.update_user.input?.nested?.name ?? [] as error}
      <Formulary.Error>{error}</Formulary.Error>
    {/each}
  {/if}
</Formulary.Field>

<!-- Execution error at the form level -->
{#if has_action_error(form, "update_user")}
  {#if form.errors.update_user.execution}
    <Formulary.Error>{form.errors.update_user.execution}</Formulary.Error>
  {/if}
{/if}
```

# Loaders

Use `error(404, ...)` or `error(400, ...)`. Never 500 — loader errors are expected situations:

```ts
import { error } from "@sveltejs/kit"

if (!property) {
  error(404, "Propiedad no encontrada")
}

if (!valid_state) {
  error(400, "Estado inválido")
}
```

# API routes / webhooks (`+server.ts`)

Log the error and return an HTTP response. No typed error wrapper needed since these are final consumers:

```ts
if (signed_document_error) {
  if (signed_document_error.type === API_FETCH_ERROR.FETCH_FAILED) {
    logger.error(
      signed_document_error.error.message,
      { contract_id, error_type: API_FETCH_ERROR.FETCH_FAILED },
      signed_document_error.error,
    )
  }
  // ... other types
  redirect(302, "/digital_signature/error")
}
```

# Non-critical side effects

When the error shouldn't block the main flow (e.g. sending notification emails), log and continue:

```ts
const [email_error] = await send_email({ to: recipient, subject, html })
if (email_error) {
  if (email_error.type === SEND_EMAIL_ERROR.FETCH_FAILED) {
    logger.error(email_error.error.message, {
      recipient_email: recipient.email,
      error_type: SEND_EMAIL_ERROR.FETCH_FAILED,
    }, email_error.error)
  }
  if (email_error.type === SEND_EMAIL_ERROR.SERVICE_ERROR) {
    logger.error(email_error.error.message, {
      recipient_email: recipient.email,
      error_type: SEND_EMAIL_ERROR.SERVICE_ERROR,
    }, email_error.error)
  }
}
// execution continues regardless
```

# Client-side logging

`hooks.client.ts` exports `handleError` that calls `logger.error` for all unhandled client errors.

## Unexpected errors (catch-all)

```ts
// hooks.client.ts
import { init_browser_telemetry } from "$lib/telemetry/sdk.client"
import { logger } from "$lib/telemetry/logger"

init_browser_telemetry()

export function handleError({ error, status, message }) {
  const err =
    error instanceof Error
      ? error
      : new Error(message)
  logger.error(err.message, { status }, err)
}
```

## Expected errors (explicit)

For anticipated failures, log explicitly with context:

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

Use `logger.warn` for notable but non-failure situations:

```ts
logger.warn("Payment status check timed out, will retry", {
  payment_id,
})
```

## Severity guide

| Method | When |
|---|---|
| `logger.error` | Something broke — unexpected crash or expected operation that failed |
| `logger.warn` | Something is off but not broken — timeouts, retries, degraded state |
| `logger.info` | Notable event for debugging — user completed a flow, feature flag activated |

# Rules

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

# Existing error constants

All constants and types are colocated in the same file as their utility function.

| Constant | File | Variants |
|---|---|---|
| `API_FETCH_ERROR` | `$lib/server/digital_signature.ts` | `FETCH_FAILED`, `API_ERROR`, `JSON_PARSE_FAILED`, `SCHEMA_VALIDATION_FAILED` |
| `GENERATE_PDF_WITH_PLAYWRIGHT_ERROR` | `$lib/server/pdf_generator.ts` | `FETCH_FAILED`, `SERVICE_ERROR`, `BUFFER_READ_FAILED` |
| `CREATE_PREFERENCE_ERROR` | `$lib/server/mercado_pago_payment.ts` | `FETCH_FAILED`, `API_ERROR`, `JSON_PARSE_FAILED`, `SCHEMA_VALIDATION_FAILED` |
| `SEND_EMAIL_ERROR` | `$lib/server/send_email.ts` | `FETCH_FAILED`, `SERVICE_ERROR` |
