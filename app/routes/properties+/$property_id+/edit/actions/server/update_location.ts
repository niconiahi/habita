import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { LocationSchema } from "~/components/location_input"
import { now } from "~/lib/now"
import { ForceNumberSchema } from "~/lib/server/force_number"
import { compose_point } from "~/lib/server/point"

export async function update_location(form_data: FormData) {
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  const location = v.parse(
    LocationSchema,
    JSON.parse(form_data.get("location") as string),
  )
  await query_builder
    .updateTable("location")
    .set({
      id,
      latitude: location.lat,
      longitude: location.lon,
      point: compose_point(location.lat, location.lon),
      house_number: location.address.house_number,
      address: location.display_name,
      road: location.address.road,
      city: location.address.city,
      town: location.address.town,
      state: location.address.state,
      suburb: location.address.suburb,
      updated_at: now,
    })
    .where("location.id", "=", id)
    .execute()
}
