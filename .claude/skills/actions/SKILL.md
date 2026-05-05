---
name: actions
description: Server-side action patterns with intent-based routing. Use when adding functionality via form submissions, handling FormData, or creating modular action functions.
---

# Actions

Whenever new functionality is added to the application, it will be added as a server side action using SvelteKit named actions.

## One action per form

Every form submits to exactly one action. The `form` prop always belongs to the form that submitted it — no disambiguation needed.

## Action constants

Each route with actions defines an `ACTION` constant object in `actions/action.ts`:

```ts
export const ACTION = {
  UPDATE_LOCATION: "update_location",
  CREATE_ROOM: "create_room",
} as const
```

## +page.server.ts caller pattern

Callers propagate the action's return directly. `fail()` returns `ActionFailure` that SvelteKit recognizes. `redirect()` throws and SvelteKit catches it. No destructuring needed:

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

No try-catch. No destructuring. The action owns all error handling internally via `fail()` and `redirect()`.

## Modular action functions

Each action is a modular function in its own `.server.ts` file. Actions use SvelteKit's `fail()` for errors and `redirect()` for navigation directly. Use `v.safeParse` (never `v.parse`) for input validation, try/catch for operations.

Two `fail()` shapes:
- **Validation errors**: `fail(400, { errors: v.flatten(issues) })`
- **Execution errors**: `fail(400, { message: "Spanish error string" })`

```ts
import { fail } from "@sveltejs/kit"
import * as v from "valibot"
import { normalize_input } from "$lib/server/form"
import { logger } from "$lib/telemetry/logger"
import { now } from "$lib/server/now"
import { ForceNumberSchema } from "$lib/force_number"
import { query_builder } from "db/query_builder"

const InputSchema = v.object({
  id: ForceNumberSchema,
  property_id: ForceNumberSchema,
})

export async function update_service(
  form_data: FormData,
  property_id: number,
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
      .updateTable("service")
      .set({
        property_id,
        updated_at: now,
        id: input.id,
      })
      .where("service.id", "=", input.id)
      .execute()
  } catch (error) {
    const typed_error =
      error instanceof Error
        ? error
        : new Error("unknown error")
    logger.error(typed_error.message, {}, typed_error)
    return fail(400, {
      message: "Error al actualizar el servicio",
    })
  }
}
```

For full error handling patterns (transactions, typed-error utilities, templates), see the `error_handling` skill.

## File organization

```
src/routes/[route]/actions/
├── action.ts              # ACTION constant object
├── create_room.server.ts  # One file per action
├── update_room.server.ts
└── destroy_room.server.ts
```

Actions are imported directly in `+page.server.ts` — no barrel export file needed.
