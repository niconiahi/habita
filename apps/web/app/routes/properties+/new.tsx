import { useState } from "react"
import { Form, redirect } from "react-router"
import * as v from "valibot"
import { LocationInput } from "~/components/location_input"
import { require_auth } from "~/lib/server/auth.server"
import { error } from "~/lib/server/error.server"
import { has_edit_access } from "~/lib/server/property_access.server"
import type { Route } from "./+types/new"
import {
  get_property_type_label,
  PROPERTY_TYPE,
  PropertyTypeSchema,
  type PropertyType,
} from "~/lib/property_type"
import * as actions from "./actions/index.server"

const INTENT = {
  CREATE_PROPERTY: "create_property",
} as const

export async function loader({
  request,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  if (!has_edit_access(user.accesses)) {
    throw error(400, "not found")
  }
  return {}
}

export async function action({
  request,
}: Route.ActionArgs) {
  const { user } = await require_auth(request)
  if (!has_edit_access(user.accesses)) {
    throw error(400, "not found")
  }
  const form_data = await request.formData()
  form_data.set("user_id", String(user.id))
  const intent = form_data.get("intent")
  if (!intent) {
    throw error(400, "intent is required")
  }
  switch (intent) {
    case INTENT.CREATE_PROPERTY: {
      const { redirect_to } =
        await actions.create_property(form_data)
      return redirect(redirect_to)
    }
  }
}

export default function () {
  const [disabled, set_disabled] = useState(true)
  const [property_type, set_property_type] =
    useState<PropertyType>(PROPERTY_TYPE.DEPARTMENT)
  return (
    <main>
      <h1>create property</h1>
      <section>
        <h2>ubicacion</h2>
        <Form method="POST">
          <input
            type="hidden"
            value={INTENT.CREATE_PROPERTY}
            name="intent"
          />
          <LocationInput
            on_selection={() => {
              set_disabled(false)
            }}
            on_clear={() => {
              set_disabled(true)
            }}
          />
          <p>
            <label htmlFor="type">tipo</label>
            <select
              name="type"
              id="type"
              required
              onChange={(event) => {
                const property_type = v.parse(
                  PropertyTypeSchema,
                  Number(event.target.value),
                )
                set_property_type(property_type)
              }}
            >
              {Object.values(PROPERTY_TYPE).map((type) => {
                const id = `property_type_${type}`
                return (
                  <option key={id} value={type}>
                    {get_property_type_label(type)}
                  </option>
                )
              })}
            </select>
          </p>
          {property_type === PROPERTY_TYPE.DEPARTMENT ? (
            <p>
              <label htmlFor="unit">unidad</label>
              <input
                required
                name="unit"
                id="unit"
                type="text"
              />
            </p>
          ) : null}
          <button disabled={disabled} type="submit">
            crear propiedad
          </button>
        </Form>
      </section>
    </main>
  )
}
