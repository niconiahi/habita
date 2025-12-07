# Metaframework

## Actions

Whenever new functionality is added to the application, it will be added as a server side action. That's why I've set up a pattern which I want you to use every time you are adding functionality to the application

```tsx
const INTENT = {
  UPDATE_SERVICE: "update_service",
} as const

export async function action({
  request,
  params,
}: Route.ActionArgs) {
  const { user } = await require_auth(request)
  if (!has_edit_access(user.accesses)) {
    throw error(400, "not found")
  }
  const form_data = await request.formData()
  const intent = form_data.get("intent")
  if (!intent) {
    throw error(400, "intent is required")
  }
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
    {
      message: "property id should be a number",
    },
  )
  form
  switch (intent) {
    case INTENT.UPDATE_SERVICE: {
      try {
        await actions.update_service(form_data)
        return null
      } catch {
        return {
          error:
            "Sólo puede haber un servicio de cada tipo",
        }
      }
    }
  }
  return null
}
```

And the action would be very modular functions like this:

```ts
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { now } from "~/lib/now"
import { ForceNumberSchema } from "~/lib/server/force_number"
import { ServiceTypeSchema } from "~/lib/service"
import { normalize_input } from "~/lib/form.server"

export const InputSchema = v.object({
  id: ForceNumberSchema,
  property_id: ForceNumberSchema,
  code: v.string(),
  type: ServiceTypeSchema,
})

export async function update_service(
  form_data: FormData,
) {
  const { id, property_id, code, type } = v.parse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  await query_builder
    .updateTable("service")
    .set({
      property_id,
      updated_at: now,
      id,
      type,
      code,
    })
    .where("service.id", "=", id)
    .execute()
}
```

As you can see, every piece of information is received as `FormData` so that it's consistent. It's barely more verbose

