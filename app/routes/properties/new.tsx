import { useState } from "react"
import { Form } from "react-router"
import * as v from "valibot"
import type { Route } from "./+types/new"
import { error } from "~/lib/server/error"
import { query_builder } from "~/lib/server/query_builder"

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
      const length = v.parse(
        v.pipe(v.string(), v.transform(Number)),
        form_data.get("length"),
      )
      const width = v.parse(
        v.pipe(v.string(), v.transform(Number)),
        form_data.get("width"),
      )
      const id = v.parse(v.string(), form_data.get("id"))
      const now = new Date()
      await query_builder
        .insertInto("property")
        .values({
          created_at: now,
          updated_at: now,
          location_id: id,
        })
        .execute()
      return null
    }
  }
}

export default function () {
  const id = "location"
  return (
    <main>
      <h1>create property</h1>
      <section>
        <h2>ubicacion</h2>
        <Form method="POST">
          <div>
            <label htmlFor={id}>direccion</label>
            <LocationInput id={id} />
            <input
              type="hidden"
              value={INTENT.CREATE_PROPERTY}
              name="intent"
            />
          </div>
        </Form>
      </section>
    </main>
  )
}

const LocationSchema = v.object({
  place_id: v.number(),
  lat: v.string(),
  lon: v.string(),
  display_name: v.string(),
  address: v.object({
    road: v.optional(v.string()),
    neighbourhood: v.optional(v.string()),
    suburb: v.optional(v.string()),
    town: v.optional(v.string()),
    state_district: v.optional(v.string()),
    state: v.optional(v.string()),
    postcode: v.optional(v.string()),
    country: v.string(),
  }),
})
type Location = v.InferOutput<typeof LocationSchema>

function LocationInput({ id }: { id: string }) {
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
          if (!query.length) {
            set_selected(null)
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
          const locations = v.parse(
            v.array(LocationSchema),
            data,
          )
          set_locations(locations)
        }}
      />
      {locations.length ? (
        <ul role="listbox" id={list_id}>
          {locations.map((location) => {
            const id = `location_${location.place_id}`
            function handle() {
              set_selected(location)
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
