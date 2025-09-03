import { useState } from "react"
import { Form, redirect } from "react-router"
import * as v from "valibot"
import type { Route } from "./+types/new"
import { error } from "~/lib/server/error"
import { query_builder } from "~/lib/server/query_builder"
import { create_point } from "~/lib/server/point"

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
              point: create_point(
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
  const id = "location"
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
          <div>
            <label htmlFor={id}>direccion</label>
            <LocationInput
              id={id}
              on_selection={() => {
                set_disabled(false)
              }}
              on_clear={() => {
                set_disabled(true)
              }}
            />
          </div>
          <button disabled={disabled} type="submit">
            crear propiedad
          </button>
        </Form>
      </section>
    </main>
  )
}

const LocationSchema = v.object({
  place_id: v.number(),
  lat: v.union([
    v.pipe(v.string(), v.transform(Number)),
    v.number(),
  ]),
  lon: v.union([
    v.pipe(v.string(), v.transform(Number)),
    v.number(),
  ]),
  display_name: v.string(),
  address: v.object({
    road: v.string(),
    house_number: v.string(),
    suburb: v.optional(v.string()),
    town: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
  }),
})
type Location = v.InferOutput<typeof LocationSchema>

function LocationInput({
  id,
  on_selection,
  on_clear,
}: {
  id: string
  on_selection: () => void
  on_clear: () => void
}) {
  const [query, set_query] = useState("")
  const [locations, set_locations] = useState<Location[]>(
    [],
  )
  const [selected, set_selected] =
    useState<Location | null>(null)
  const list_id = `${id}_listbox`
  return (
    <>
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-controls={list_id}
        aria-expanded={Boolean(locations.length)}
        value={query}
        onChange={async (event) => {
          const query = event.currentTarget.value
          if (query.length >= 1) {
            set_selected(null)
            on_clear()
          }
          const url = new URL(
            "/nominatim/search",
            window.location.origin,
          )
          set_query(query)
          url.searchParams.set("q", query)
          url.searchParams.set("addressdetails", String(1))
          const response = await fetch(url).catch(() => {
            throw new Error(
              "unknown error while searching for an address",
            )
          })
          if (!response.ok) {
            throw new Error(
              "there was an error while searching for an address",
            )
          }
          const data = await response.json()
          const locations: Location[] = []
          for (const location_ of data) {
            const result = v.safeParse(
              LocationSchema,
              location_,
            )
            if (result.success) {
              locations.push(result.output)
            }
          }
          set_locations(locations)
        }}
      />
      {locations.length ? (
        <ul role="listbox" id={list_id}>
          {locations.map((location) => {
            const id = `location_${location.place_id}`
            function handle() {
              set_selected(location)
              on_selection()
              set_query(location.display_name)
              set_locations([])
            }
            return (
              <li
                role="option"
                key={id}
                onClick={handle}
                onKeyPress={handle}
              >
                {location.display_name}
              </li>
            )
          })}
        </ul>
      ) : null}
      <input
        type="hidden"
        name="location"
        value={JSON.stringify(selected)}
      />
    </>
  )
}
