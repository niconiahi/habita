import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { query_builder } from "db/query_builder"

export async function update_period(form_data: FormData) {
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  const price = v.parse(ForceNumberSchema, form_data.get("price"))
  await query_builder
    .updateTable("period")
    .set({
      price,
      updated_at: new Date(),
    })
    .where("period.id", "=", id)
    .execute()
}
