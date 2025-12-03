import * as v from "valibot"
import { LocationSchema } from "~/components/location_input"
import { compose_point } from "~/lib/point.server"
import { query_builder } from "~/lib/query_builder.server"
import {
  PROPERTY_TYPE,
  PropertyTypeSchema,
} from "~/lib/property_type"
import { PROPERTY_STATE } from "~/lib/property_state"
import { ACCESS_TYPE } from "~/lib/access_type"
import { ForceNumberSchema } from "~/lib/force_number"
import { PropertyDestinySchema } from "~/lib/property_destiny"

export async function create_property(form_data: FormData) {
  const location_ = v.parse(
    LocationSchema,
    JSON.parse(form_data.get("location") as string),
  )
  const type = v.parse(
    PropertyTypeSchema,
    Number(form_data.get("type")),
  )
  const destinies = v.parse(
    v.array(PropertyDestinySchema),
    form_data.getAll("destiny").map(Number),
  )
  const now = new Date().toISOString()
  const property = await query_builder
    .transaction()
    .execute(async (tx) => {
      const location = await tx
        .insertInto("location")
        .values({
          latitude: location_.lat,
          longitude: location_.lon,
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
      let unit = null
      if (type === PROPERTY_TYPE.DEPARTMENT) {
        const unit_ = v.parse(
          v.string(),
          form_data.get("unit"),
        )
        unit = unit_
      }
      const property = await tx
        .insertInto("property")
        .values({
          type,
          unit,
          destinies,
          state: PROPERTY_STATE.EDITING,
          created_at: now,
          updated_at: now,
          location_id: location.id,
        })
        .returning("property.id")
        .executeTakeFirstOrThrow()
      const user_id = v.parse(
        ForceNumberSchema,
        form_data.get("user_id"),
      )
      await tx
        .insertInto("access")
        .values({
          type: ACCESS_TYPE.ADMINISTRATOR,
          created_at: now,
          updated_at: now,
          property_id: property.id,
          user_id,
        })
        .executeTakeFirstOrThrow()
      return property
    })
  return { redirect_to: `/properties/${property.id}/edit` }
}
