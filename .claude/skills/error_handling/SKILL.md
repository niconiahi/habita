---
name: error_handling
description: Error handling patterns across the entire application. Use when writing actions, utility functions, callers, templates, loaders, API routes, or any code that can fail.
---

Full reference: `apps/web/docs/error_handling.md`

# Core principle

Two layers of error handling:

1. **Utility functions** — Go-style `[error, result]` tuples. Functions never throw. `safe_async` wraps promises, `safe_sync` wraps synchronous code. Typed errors colocated with their utility function.
2. **Actions** — SvelteKit-native `fail()` and `redirect()`. One action per form. Actions use try/catch internally and return `fail()` for errors or call `redirect()` for navigation. Callers just propagate the return.

# Core primitives

## `safe_async` (`$lib/safe_async.ts`)

Wraps any `Promise<T>` into a tuple. Catches thrown errors:

```ts
const [error, data] = await safe_async(fetch("..."))
// error: Error | null
// data: T | null
```

Used in **utility functions** and **non-critical side effects**. NOT used in actions — actions use try/catch + `fail()` instead.

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

Actions are server-side functions triggered by form submissions. One action per form — no shared forms across actions. Actions use SvelteKit's `fail()` for errors and `redirect()` for navigation directly.

## Fail shapes

There are exactly two `fail()` shapes:

### Validation errors

When `v.safeParse` fails, return flattened validation errors:

```ts
return fail(400, { errors: v.flatten(input_validation.issues) })
```

Templates access per-field errors via `form?.errors?.nested?.field_name`.

### Execution errors

When an operation fails (DB, API call, etc.), return a message string in Spanish:

```ts
return fail(400, { message: "Error al actualizar" })
```

Templates access via `form?.message`.

## Input validation

Use `v.safeParse` inside actions, NEVER `v.parse`. Use `v.flatten` for validation errors:

```ts
const InputSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "El nombre es requerido")),
})

export async function update_thing(form_data: FormData) {
  const input_validation = v.safeParse(InputSchema, normalize_input(form_data, InputSchema))
  if (!input_validation.success) {
    return fail(400, { errors: v.flatten(input_validation.issues) })
  }
  const input = input_validation.output
  // ...
}
```

## Execution errors

Wrap each operation in its own try/catch. Log before returning `fail()`:

```ts
try {
  await query_builder
    .updateTable("thing")
    .set({ name: input.name })
    .execute()
} catch (error) {
  const typed_error = error instanceof Error ? error : new Error("unknown error")
  logger.error(typed_error.message, {}, typed_error)
  return fail(400, { message: "Error al actualizar" })
}
```

## Actions without FormData input

Some actions don't receive user input — they operate on pre-validated parameters. Skip `v.safeParse`, only have execution errors:

```ts
export async function create_room(property_id: number) {
  try {
    await query_builder
      .insertInto("room")
      .values({ property_id, created_at: now, updated_at: now })
      .execute()
  } catch (error) {
    const typed_error = error instanceof Error ? error : new Error("unknown error")
    logger.error(typed_error.message, {}, typed_error)
    return fail(400, { message: "Error al crear la habitación" })
  }
}
```

## Redirect actions

When an action needs to redirect on success, call `redirect()` directly:

```ts
export async function create_property(form_data: FormData) {
  const input_validation = v.safeParse(InputSchema, normalize_input(form_data, InputSchema))
  if (!input_validation.success) {
    return fail(400, { errors: v.flatten(input_validation.issues) })
  }
  const input = input_validation.output

  let property
  try {
    property = await query_builder.transaction().execute(async (tx) => {
      // ... create location, property
      return { id: result.id }
    })
  } catch (error) {
    const typed_error = error instanceof Error ? error : new Error("unknown error")
    logger.error(typed_error.message, {}, typed_error)
    return fail(400, { message: "Error al crear la propiedad" })
  }

  redirect(303, `/admin/properties/${property.id}/edit/characteristics`)
}
```

## Sequential operations or loops = transaction

If an action has more than one DB operation (sequential steps or loop iterations), it MUST be wrapped in a transaction. All succeed or all fail. No exceptions.

### Sequential example

```ts
try {
  await query_builder.transaction().execute(async (tx) => {
    const row = await tx.insertInto("foo").returning("id").executeTakeFirstOrThrow()
    await tx.insertInto("bar").values({ foo_id: row.id }).execute()
  })
} catch (error) {
  const typed_error = error instanceof Error ? error : new Error("unknown error")
  logger.error(typed_error.message, {}, typed_error)
  return fail(400, { message: "Error message" })
}
```

### Loop example

```ts
try {
  await query_builder.transaction().execute(async (tx) => {
    for (const { room_id, position } of positions) {
      await tx
        .insertInto("room")
        .values({ id: room_id, property_id, position, created_at: now, updated_at: now })
        .onConflict((oc) =>
          oc.column("id").doUpdateSet({ position, updated_at: now }),
        )
        .execute()
    }
  })
} catch (error) {
  const typed_error = error instanceof Error ? error : new Error("unknown error")
  logger.error(typed_error.message, {}, typed_error)
  return fail(400, { message: "Error al actualizar las posiciones" })
}
```

If any operation inside the transaction throws, Kysely rolls back automatically — no orphaned rows.

## Actions calling typed-error utilities

When an action calls a utility that returns typed errors, match each error type and map to `fail()`. Always include a fallback after all if-branches:

```ts
const [pdf_error, content] = await generate_pdf_with_playwright(html)
if (pdf_error) {
  if (pdf_error.type === GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.FETCH_FAILED) {
    return fail(400, { message: "No se pudo conectar al servicio de PDF" })
  }
  if (pdf_error.type === GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.SERVICE_ERROR) {
    return fail(400, { message: "Error en el servicio de generación de PDF" })
  }
  // Fallback for forward-compatibility
  return fail(400, { message: "Error al generar el PDF" })
}
```

## Multiple input shapes

One function per shape. Each has its own `v.object` InputSchema. The caller reads the discriminant and dispatches:

```ts
const warranty_type = v.parse(v.picklist(["salary", "property"]), form_data.get("warranty_type"))
switch (warranty_type) {
  case "salary":
    return create_salary_warranty(form_data)
  case "property":
    return create_property_warranty(form_data)
}
```

Each action function uses the same `fail()` shapes — `{ errors: v.flatten(...) }` or `{ message: "..." }`.

# Callers (+page.server.ts)

Callers just propagate the action's return. `fail()` returns an `ActionFailure` that SvelteKit recognizes. `redirect()` throws and SvelteKit catches it. No destructuring needed.

## Standard caller

```ts
return update_thing(form_data)
```

## Redirect caller

```ts
// redirect() is called inside the action — nothing extra here
return create_property(form_data)
```

## Full `+page.server.ts` example

```ts
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_edit_access } from "$lib/server/property_access"
import { update_location } from "./actions/update_location.server"
import { create_room } from "./actions/create_room.server"
import { ACTION } from "./actions/action"
import type { Actions } from "./$types"

export const actions: Actions = {
  [ACTION.UPDATE_LOCATION]: async ({ request, locals, params }) => {
    require_authentication(locals)
    const property_id = v.parse(ForceNumberSchema, params.property_id)
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const form_data = await request.formData()
    form_data.set("property_id", String(property_id))
    return update_location(form_data)
  },
  [ACTION.CREATE_ROOM]: async ({ request, locals, params }) => {
    require_authentication(locals)
    const property_id = v.parse(ForceNumberSchema, params.property_id)
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    return create_room(property_id)
  },
}
```

# Templates

`fail(400, data)` makes `data` available as the `form` prop. Use optional chaining directly — no utility function needed.

## Displaying validation errors per field

```svelte
<Formulary.Input
  label="Nombre"
  name="name"
  value={data.name}
  error={form?.errors?.nested?.name?.[0]}
/>
```

## Displaying execution errors

```svelte
{#if form?.message}
  <Formulary.Error>{form.message}</Formulary.Error>
{/if}
```

## Combined example

A typical form handles both validation and execution errors:

```svelte
<Formulary.Root action={compose_action(ACTION.UPDATE_USER)} method="POST">
  <Formulary.Input
    label="Nombre"
    name="name"
    value={data.user_profile.name}
    error={form?.errors?.nested?.name?.[0]}
  />
  <Formulary.Input
    label="Apellido"
    name="surname"
    value={data.user_profile.surname}
    error={form?.errors?.nested?.surname?.[0]}
  />
  {#if form?.message}
    <Formulary.Error>{form.message}</Formulary.Error>
  {/if}
  <Button variant="primary" type="submit">Guardar</Button>
</Formulary.Root>
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

1. **No `throw` in utilities** — utility functions return tuples, never throw.
2. **No `as` assertions** — use Valibot schemas for validation.
3. **No magic strings** — always reference the constant (`SEND_EMAIL_ERROR.FETCH_FAILED`, not `"fetch_failed"`).
4. **Log at the source** — the utility or action that detects the error logs it. Callers may log additional context.
5. **Every if-branch per type** — callers of typed-error utilities must handle each error variant explicitly, even if the handling is the same.
6. **Fallback return** — after all typed if-branches in actions, include a generic fallback error return.
7. **`v.safeParse` inside actions** — never `v.parse`. Actions own validation internally.
8. **`v.flatten` for validation errors** — shows all validation failures, not just the first one.
9. **Callers propagate** — `return action(form_data)`. No destructuring, no wrapping.
10. **`fail()` for errors, `redirect()` for navigation** — actions call these directly.
11. **One action per form** — no shared forms across actions. The `form` prop always belongs to the form that submitted.

# Existing error constants

All constants and types are colocated in the same file as their utility function.

| Constant | File | Variants |
|---|---|---|
| `API_FETCH_ERROR` | `$lib/server/digital_signature.ts` | `FETCH_FAILED`, `API_ERROR`, `JSON_PARSE_FAILED`, `SCHEMA_VALIDATION_FAILED` |
| `GENERATE_PDF_WITH_PLAYWRIGHT_ERROR` | `$lib/server/pdf_generator.ts` | `FETCH_FAILED`, `SERVICE_ERROR`, `BUFFER_READ_FAILED` |
| `CREATE_PREFERENCE_ERROR` | `$lib/server/mercado_pago_payment.ts` | `FETCH_FAILED`, `API_ERROR`, `JSON_PARSE_FAILED`, `SCHEMA_VALIDATION_FAILED` |
| `SEND_EMAIL_ERROR` | `$lib/server/send_email.ts` | `FETCH_FAILED`, `SERVICE_ERROR` |
