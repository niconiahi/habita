import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { now } from "$lib/server/now"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"

export const InputSchema = v.object({
  construction_year: v.optional(ForceNumberSchema),
})

export async function update_construction_year(
  form_data: FormData,
  property_id: number,
) {
  const { construction_year } = v.parse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  await query_builder
    .updateTable("property")
    .set({
      construction_year: construction_year ?? null,
      updated_at: now,
    })
    .where("property.id", "=", property_id)
    .execute()
}
