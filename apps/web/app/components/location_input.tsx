import { useState } from "react"
import * as v from "valibot"
import { ForceNumberSchema } from "~/lib/force_number"

export const LocationSchema = v.object({
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
    house_number: ForceNumberSchema,
    suburb: v.optional(v.string()),
    town: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
  }),
})
type Location = v.InferOutput<typeof LocationSchema>

export function LocationInput({
  default_value,
  on_selection,
  on_clear,
}: {
  default_value?: string
  on_selection: () => void
  on_clear: () => void
}) {
  const [query, set_query] = useState(default_value ?? "")
  const [locations, set_locations] = useState<Location[]>(
    [],
  )
  const [selected, set_selected] =
    useState<Location | null>(null)
  const id = "location"
  const list_id = `${id}_listbox`
  return (
    <div>
      <label htmlFor={id}>direccion</label>
      <input
        id={id}
        style={{ minWidth: "400px" }}
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
                onKeyDown={handle}
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
    </div>
  )
}
