import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { LocationSchema } from "$lib/components/LocationInput.svelte"
import { ForceNumberSchema } from "$lib/force_number"
import { compose_point } from "$lib/server/point"
import { PropertyDestinySchema } from "$lib/property_destiny"
import { PROPERTY_STATE } from "$lib/property_state"
import {
  PROPERTY_TYPE,
  PropertyTypeSchema,
} from "$lib/property_type"
import { ACCESS_TYPE } from "$lib/access_type"
import { get_user_organization } from "$lib/server/organization"
import { assign_property_access } from "$lib/server/property_access"
import { query_builder } from "db/query_builder"

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
  const user_id = v.parse(
    ForceNumberSchema,
    form_data.get("user_id"),
  )
  const user_org = await get_user_organization(user_id)
  if (!user_org) {
    error(403, "User must belong to an organization to create properties")
  }
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
          realtor_id: user_org.id,
          created_at: now,
          updated_at: now,
          location_id: location.id,
        })
        .returning("property.id")
        .executeTakeFirstOrThrow()
      return { id: property.id }
    })
  await assign_property_access(property.id, user_id, ACCESS_TYPE.MANAGER)
  return {
    redirect_to: `/admin/properties/${property.id}/edit`,
  }
}
