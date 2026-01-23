import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { ForceNumberSchema } from "$lib/force_number"
import { now } from "$lib/server/now"
import { PROPERTY_STATE } from "$lib/property_state"

export async function unpublish_property(
  form_data: FormData,
) {
  const property_id = v.parse(
    ForceNumberSchema,
    form_data.get("property_id"),
  )
  await query_builder
    .updateTable("property")
    .set({
      state: PROPERTY_STATE.EDITING,
      updated_at: now,
    })
    .where("property.id", "=", property_id)
    .execute()
}
