import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { DateSchema } from "~/lib/date"
import { now } from "~/lib/now"
import { ForceNumberSchema } from "~/lib/server/force_number"

export async function update_contract(
  form_data: FormData,
  property_id: number,
) {
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  const formula = v.parse(
    v.string(),
    form_data.get("formula"),
  )
  const duration = v.parse(
    v.string(),
    form_data.get("duration"),
  )
  const start_date = v.parse(
    DateSchema,
    form_data.get("start_date"),
  )
  const end_date = v.parse(
    DateSchema,
    form_data.get("end_date"),
  )
  await query_builder
    .updateTable("contract")
    .set({
      property_id,
      updated_at: now,
      formula,
      duration,
      start_date,
      end_date,
    })
    .where("contract.id", "=", id)
    .execute()
}
