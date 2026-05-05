# Error handling

This codebase uses two layers of error handling:

1. **Utility functions** — Go-style `[error, result]` tuples. Functions never throw. `safe_async` wraps promises, `safe_sync` wraps synchronous code. Typed errors colocated with their utility function.
2. **Actions** — SvelteKit-native `fail()` and `redirect()`. One action per form. Actions use try/catch internally and return `fail()` for errors or call `redirect()` for navigation. Callers just propagate the return.

## Core primitives

### `safe_async` (`$lib/safe_async.ts`)

Wraps any `Promise<T>` into a tuple. Catches thrown errors.

```ts
const [error, data] = await safe_async(fetch("..."))
// error: Error | null
// data: T | null
```

Used in **utility functions** and **non-critical side effects**. NOT used in actions — actions use try/catch + `fail()` instead.

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

Actions are server-side functions triggered by form submissions. One action per form — the `form` prop always belongs to the form that submitted. Actions use SvelteKit's `fail()` for errors and `redirect()` for navigation directly.

### Fail shapes

There are exactly two `fail()` shapes:

**Validation errors** — when `v.safeParse` fails:

```ts
return fail(400, { errors: v.flatten(input_validation.issues) })
```

**Execution errors** — when an operation fails:

```ts
return fail(400, { message: "Error al actualizar" })
```

### Inside the action

Every action follows this structure:

```ts
import { fail } from "@sveltejs/kit"
import * as v from "valibot"
import { normalize_input } from "$lib/server/form"
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
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  // 2. Execute operation — try/catch
  try {
    await query_builder
      .updateTable("thing")
      .set({
        name: input.name,
        surname: input.surname,
        updated_at: now,
      })
      .where("thing.id", "=", input.id)
      .execute()
  } catch (error) {
    const typed_error =
      error instanceof Error
        ? error
        : new Error("unknown error")
    logger.error(typed_error.message, {}, typed_error)
    return fail(400, {
      message: "Error al actualizar",
    })
  }

  // 3. Success — implicit return (void)
}
```

### Redirect actions

When an action needs to redirect on success, call `redirect()` directly:

```ts
export async function create_property(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  let property
  try {
    property = await query_builder
      .transaction()
      .execute(async (tx) => {
        // ... create location, property
        return { id: result.id }
      })
  } catch (error) {
    const typed_error =
      error instanceof Error
        ? error
        : new Error("unknown error")
    logger.error(typed_error.message, {}, typed_error)
    return fail(400, {
      message: "Error al crear la propiedad",
    })
  }

  redirect(
    303,
    `/admin/properties/${property.id}/edit/characteristics`,
  )
}
```

### Actions without FormData input

Some actions don't receive user input — they operate on pre-validated parameters. These skip the `v.safeParse` step and only have execution errors:

```ts
export async function create_room(property_id: number) {
  try {
    await query_builder
      .insertInto("room")
      .values({
        property_id,
        created_at: now,
        updated_at: now,
      })
      .execute()
  } catch (error) {
    const typed_error =
      error instanceof Error
        ? error
        : new Error("unknown error")
    logger.error(typed_error.message, {}, typed_error)
    return fail(400, {
      message: "Error al crear la habitación",
    })
  }
}
```

### Actions with sequential operations

When an action performs multiple operations, wrap them in a transaction — all succeed or all fail:

```ts
import { fail } from "@sveltejs/kit"
import * as v from "valibot"
import { normalize_input } from "$lib/server/form"
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
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  try {
    await query_builder
      .transaction()
      .execute(async (tx) => {
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

        await tx
          .insertInto("contract_income_guarantor")
          .values({
            contract_id: input.contract_id,
            income_guarantor_id: guarantor.id,
            created_at: now,
          })
          .execute()
      })
  } catch (error) {
    const typed_error =
      error instanceof Error
        ? error
        : new Error("unknown error")
    logger.error(typed_error.message, {}, typed_error)
    return fail(400, {
      message: "Error al crear el garante",
    })
  }
}
```

If any operation inside the transaction throws, Kysely rolls back automatically — no orphaned rows.

### Actions with loops

When an action operates on a list of items, wrap the loop in a transaction — all items update or none do:

```ts
import { fail } from "@sveltejs/kit"
import { logger } from "$lib/telemetry/logger"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"

export async function update_room_positions(
  property_id: number,
  positions: Array<{ room_id: number; position: number }>,
) {
  try {
    await query_builder
      .transaction()
      .execute(async (tx) => {
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
      })
  } catch (error) {
    const typed_error =
      error instanceof Error
        ? error
        : new Error("unknown error")
    logger.error(typed_error.message, {}, typed_error)
    return fail(400, {
      message: "Error al actualizar las posiciones",
    })
  }
}
```

### Rule: sequential or loop = transaction

If an action has more than one database operation (sequential steps or loop iterations), it must be wrapped in a transaction. All succeed or all fail. No exceptions.

### Actions calling typed-error utilities

When an action calls a utility that returns typed errors (e.g. `generate_pdf_with_playwright`, `send_email`), match each error type and map it to `fail()`:

```ts
const [pdf_error, content] =
  await generate_pdf_with_playwright(html)
if (pdf_error) {
  if (
    pdf_error.type ===
    GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.FETCH_FAILED
  ) {
    return fail(400, {
      message:
        "No se pudo conectar al servicio de PDF",
    })
  }
  if (
    pdf_error.type ===
    GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.SERVICE_ERROR
  ) {
    return fail(400, {
      message:
        "Error en el servicio de generación de PDF",
    })
  }
  if (
    pdf_error.type ===
    GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.BUFFER_READ_FAILED
  ) {
    return fail(400, {
      message:
        "Error al leer el contenido del PDF generado",
    })
  }
  return fail(400, {
    message: "Error al generar el PDF",
  })
}
```

Always include a fallback return after all if-branches for forward-compatibility when new error types are added.

### Actions with multiple input shapes

When a concept has multiple shapes (e.g. different warranty types), create one action per shape. Each action has its own clean `v.object` InputSchema. The caller reads the discriminant from `FormData` and dispatches to the correct function.

**Caller** — reads the type and dispatches:

```ts
[ACTION.CREATE_WARRANTY]: async ({ request, locals, params }) => {
  // ... auth, access checks
  const form_data = await request.formData()
  const warranty_type = v.parse(v.picklist(["salary", "property"]), form_data.get("warranty_type"))

  switch (warranty_type) {
    case "salary":
      return create_salary_warranty(form_data)
    case "property":
      return create_property_warranty(form_data)
  }
}
```

Each action uses the same `fail()` shapes — `{ errors: v.flatten(...) }` or `{ message: "..." }`.

## Caller patterns

Callers propagate the action's return directly:

### Standard caller

```ts
return update_thing(form_data)
```

### Redirect caller

```ts
// redirect() is called inside the action
return create_property(form_data)
```

### Full `+page.server.ts` example

```ts
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
    require_authentication(locals)
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
    form_data.set("property_id", String(property_id))
    return update_location(form_data)
  },
  [ACTION.CREATE_ROOM]: async ({
    request,
    locals,
    params,
  }) => {
    require_authentication(locals)
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
    return create_room(property_id)
  },
}
```

No try-catch. No destructuring. The action owns all error handling internally.

## Template patterns

`fail(400, data)` makes `data` available as the `form` prop. Use optional chaining directly.

### Validation errors per field

```svelte
<Formulary.Input
  label="Nombre"
  name="name"
  value={data.name}
  error={form?.errors?.nested?.name?.[0]}
/>
```

### Execution errors

```svelte
{#if form?.message}
  <Formulary.Error>{form.message}</Formulary.Error>
{/if}
```

### Combined example

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

## File organization

```
src/routes/[route]/actions/
├── action.ts              # ACTION constant object
├── create_room.server.ts  # One file per action
├── update_room.server.ts
└── destroy_room.server.ts
```

Actions are imported directly in `+page.server.ts` — no barrel export file needed.

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

SvelteKit's `handleError` hook in `hooks.client.ts` catches all unhandled client errors:

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

### Expected errors (explicit)

When client-side code handles an anticipated failure, log it explicitly with context:

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
