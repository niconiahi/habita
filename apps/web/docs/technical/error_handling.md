# Error handling

This codebase uses two layers of error handling:

1. **Utility functions** — Custom `Error` subclasses with a `.type` discriminant. Functions throw on failure. Callers catch and match with `instanceof` + `.type`.
2. **Actions** — SvelteKit-native `fail()` and `redirect()`. One action per form. Actions use try/catch internally and return `fail()` for errors or call `redirect()` for navigation. Callers just propagate the return.

## Typed errors

Utility functions throw custom Error subclasses so callers can match on the failure reason.

### Defining error constants and Error subclass

Everything lives in the same file as the utility function — no separate `_error.ts` files. Use `as const` + `ObjectValues` from `$lib/compose_types.ts`. Numeric values, SCREAMING_SNAKE keys. The class extends `Error` and carries a `.type` discriminant:

```ts
import type { ObjectValues } from "$lib/compose_types"

export const SEND_EMAIL_ERROR = {
  FETCH_FAILED: 0,
  SERVICE_ERROR: 1,
} as const

export class SendEmailError extends Error {
  constructor(
    public type: ObjectValues<typeof SEND_EMAIL_ERROR>,
    cause: Error,
  ) {
    super(cause.message, { cause })
  }
}
```

The constant, Error subclass, and utility function all live together in one file (e.g. `$lib/server/send_email.ts`).

### Function signatures

Utility functions return their success value directly (or `void`). They throw the Error subclass on failure:

```ts
export async function send_email(
  body: SendEmailBody,
): Promise<void> {
```

When the function returns data on success:

```ts
export async function generate_pdf_with_playwright(
  html: string,
): Promise<Buffer> {
```

### Throwing errors from utilities

Each error site uses try/catch with `if (error instanceof Error)` / `else logger.unknown(error)`:

```ts
let response: Response
try {
  response = await fetch("...")
} catch (error) {
  if (error instanceof Error) {
    logger.error(error.message, {}, error)
    throw new SendEmailError(
      SEND_EMAIL_ERROR.FETCH_FAILED,
      error,
    )
  } else {
    logger.unknown(error)
    throw new SendEmailError(
      SEND_EMAIL_ERROR.FETCH_FAILED,
      new Error("unknown error"),
    )
  }
}
```

For non-catch errors (e.g. `!response.ok`), construct an Error and throw directly:

```ts
if (!response.ok) {
  const error_text = await response.text()
  const service_error = new Error(
    `Email service error: ${response.status} - ${error_text}`,
  )
  logger.error(service_error.message, {}, service_error)
  throw new SendEmailError(
    SEND_EMAIL_ERROR.SERVICE_ERROR,
    service_error,
  )
}
```

## Action error handling

Actions are server-side functions triggered by form submissions. One action per form — the `form` prop always belongs to the form that submitted. Actions use SvelteKit's `fail()` for errors and `redirect()` for navigation directly.

### Fail shapes

There are exactly two `fail()` shapes:

**Validation errors** — when `v.safeParse` fails:

```ts
return fail(400, {
  errors: v.flatten(input_validation.issues),
})
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
        updated_at: now,
      })
      .where("thing.id", "=", input.id)
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al actualizar",
    })
  }

  // 3. Success — implicit return (void)
}
```

### Actions calling typed-error utilities

When an action calls a utility that throws typed errors, catch and match with `instanceof` + `.type`. Always include a fallback:

```ts
let content: Buffer
try {
  content = await generate_pdf_with_playwright(html)
} catch (error) {
  if (error instanceof GeneratePdfWithPlaywrightError) {
    if (
      error.type ===
      GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.FETCH_FAILED
    ) {
      return fail(400, {
        message: "No se pudo conectar al servicio de PDF",
      })
    }
    if (
      error.type ===
      GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.SERVICE_ERROR
    ) {
      return fail(400, {
        message:
          "Error en el servicio de generación de PDF",
      })
    }
    return fail(400, {
      message: "Error al generar el PDF",
    })
  } else {
    logger.unknown(error)
  }
  return fail(400, {
    message: "Error al generar el PDF",
  })
}
```

Always include a fallback return after all if-branches for forward-compatibility when new error types are added.

### Actions with sequential operations

When an action performs multiple operations, wrap them in a transaction — all succeed or all fail:

```ts
try {
  await query_builder.transaction().execute(async (tx) => {
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
  if (error instanceof Error) {
    logger.error(error.message, {}, error)
  } else {
    logger.unknown(error)
  }
  return fail(400, {
    message: "Error al crear el garante",
  })
}
```

If any operation inside the transaction throws, Kysely rolls back automatically — no orphaned rows.

### Rule: sequential or loop = transaction

If an action has more than one database operation (sequential steps or loop iterations), it must be wrapped in a transaction. All succeed or all fail. No exceptions.

## Caller patterns

Callers propagate the action's return directly:

```ts
return update_thing(form_data)
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

## Loaders (`+page.server.ts` load functions)

Use SvelteKit's `error()` helper with the appropriate status code. Loader errors are expected situations (missing records, bad params) — never use 500:

```ts
import { error } from "@sveltejs/kit"

if (!property) {
  error(404, "Propiedad no encontrada")
}
```

## API routes / webhooks (`+server.ts`)

Use try/catch directly. Log the error and return an HTTP response:

```ts
let response: Response
try {
  response = await fetch("...")
} catch (error) {
  if (error instanceof Error) {
    logger.error(error.message, { payment_id }, error)
  } else {
    logger.unknown(error)
  }
  return
}
```

## Non-critical side effects

When the error shouldn't block the main flow, catch, log, and continue:

```ts
try {
  await send_email({ to: recipient, subject, html })
} catch (error) {
  if (error instanceof SendEmailError) {
    logger.error(error.message, { recipient_email }, error)
  } else {
    logger.unknown(error)
  }
}
// execution continues regardless
```

## Client-side error logging

The `logger` from `$lib/telemetry/logger.ts` is isomorphic — same import works on both server and client. On the client, the browser OpenTelemetry SDK (initialized in `hooks.client.ts`) batches logs and sends them through `/api/logger` → otel-collector.

### Severity guide

| Method           | When                                                                        |
| ---------------- | --------------------------------------------------------------------------- |
| `logger.error`   | Something broke — unexpected crash or expected operation that failed        |
| `logger.warn`    | Something is off but not broken — timeouts, retries, degraded state         |
| `logger.info`    | Notable event for debugging — user completed a flow, feature flag activated |
| `logger.unknown` | Non-Error value caught — coerces to Error and logs at error severity        |

## Rules

1. **Utilities throw Error subclasses** — utility functions throw custom Error subclasses, never return tuples.
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

All constants and Error subclasses are colocated in the same file as their utility function.

| Constant                             | File                                  | Variants                                                                     |
| ------------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------- |
| `API_FETCH_ERROR`                    | `$lib/server/digital_signature.ts`    | `FETCH_FAILED`, `API_ERROR`, `JSON_PARSE_FAILED`, `SCHEMA_VALIDATION_FAILED` |
| `GENERATE_PDF_WITH_PLAYWRIGHT_ERROR` | `$lib/server/pdf_generator.ts`        | `FETCH_FAILED`, `SERVICE_ERROR`, `BUFFER_READ_FAILED`                        |
| `CREATE_PREFERENCE_ERROR`            | `$lib/server/mercado_pago_payment.ts` | `FETCH_FAILED`, `API_ERROR`, `JSON_PARSE_FAILED`, `SCHEMA_VALIDATION_FAILED` |
| `SEND_EMAIL_ERROR`                   | `$lib/server/send_email.ts`           | `FETCH_FAILED`, `SERVICE_ERROR`                                              |
| `OBJECT_STORE_ERROR`                 | `$lib/server/object_store.ts`         | `PUT_FAILED`, `GET_FAILED`, `DELETE_FAILED`, `NOT_FOUND`                     |
