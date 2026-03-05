---
name: actions
description: Server-side action patterns with intent-based routing. Use when adding functionality via form submissions, handling FormData, or creating modular action functions.
---

# Actions

Whenever new functionality is added to the application, it will be added as a server side action using SvelteKit named actions.

## Action constants

Each route with actions defines an `ACTION` constant object in `actions/action.ts`:

```ts
export const ACTION = {
  UPDATE_LOCATION: "update_location",
  CREATE_ROOM: "create_room",
} as const
```

## +page.server.ts caller pattern

ALWAYS explicit destructure. Never `return await action()`. The action produces the error payload, the caller wraps it in `{ errors }` for SvelteKit:

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
    form_data.set("property_id", String(property_id))
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

## Modular action functions

Each action is a modular function in its own `.server.ts` file. Actions return Go-style tuples `[errors, data]` with `as const`. Use `v.safeParse` (never `v.parse`) for input validation, `safe_async` for DB operations:

```ts
import * as v from "valibot"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
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
    return [
      {
        update_service: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [error] = await safe_async(
    query_builder
      .updateTable("service")
      .set({
        property_id,
        updated_at: now,
        id: input.id,
      })
      .where("service.id", "=", input.id)
      .execute(),
  )
  if (error) {
    logger.error(error.message, {}, error)
    return [
      {
        update_service: {
          execution: "Error al actualizar el servicio",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
```

For full error handling patterns (data-returning actions, transactions, typed-error utilities, templates), see the `error_handling` skill.

## File organization

```
src/routes/[route]/actions/
├── action.ts              # ACTION constant object
├── create_room.server.ts  # One file per action
├── update_room.server.ts
└── destroy_room.server.ts
```

Actions are imported directly in `+page.server.ts` — no barrel export file needed.
