import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { assign_property_to_admin } from "$lib/server/organization"

export async function reassign_property(form_data: FormData) {
  const property_id = v.parse(
    ForceNumberSchema,
    form_data.get("property_id"),
  )
  const admin_id_raw = form_data.get("admin_id")
  const admin_id = admin_id_raw
    ? v.parse(ForceNumberSchema, admin_id_raw)
    : null

  await assign_property_to_admin(property_id, admin_id)

  return { property_id, admin_id }
}
