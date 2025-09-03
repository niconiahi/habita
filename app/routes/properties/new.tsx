import { useState } from "react"
import { Form, redirect } from "react-router"
import * as v from "valibot"
import type { Route } from "./+types/new"
import { error } from "~/lib/server/error"
import { query_builder } from "~/lib/server/query_builder"
import { compose_point } from "~/lib/server/point"
import {
  LocationInput,
  LocationSchema,
} from "~/components/location_input"

const INTENT = {
  CREATE_PROPERTY: "create_property",
} as const

export async function action({
  request,
}: Route.ActionArgs) {
  const form_data = await request.formData()
  const intent = form_data.get("intent")
  if (!intent) {
    throw error(400, "intent is required")
  }
  switch (intent) {
    case INTENT.CREATE_PROPERTY: {
      const location_ = v.parse(
        LocationSchema,
        JSON.parse(form_data.get("location") as string),
      )
      const now = new Date()
      const property = await query_builder
        .transaction()
        .execute(async (trx) => {
          const location = await trx
            .insertInto("location")
            .values({
              road: location_.address.road,
              house_number: location_.address.house_number,
              suburb: location_.address.suburb,
              town: location_.address.town,
              city: location_.address.city,
              state: location_.address.state,
              point: compose_point(
                location_.lat,
                location_.lon,
              ),
              address: location_.display_name,
              created_at: now,
              updated_at: now,
            })
            .returning("id")
            .executeTakeFirstOrThrow()
          const property = await trx
            .insertInto("property")
            .values({
              created_at: now,
              updated_at: now,
              location_id: location.id,
            })
            .returning("property.id")
            .executeTakeFirstOrThrow()
          return property
        })
      return redirect(`/properties/${property.id}/edit`)
    }
  }
}

export default function () {
  const [disabled, set_disabled] = useState(true)
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
          <button disabled={disabled} type="submit">
            crear propiedad
          </button>
        </Form>
      </section>
    </main>
  )
}
