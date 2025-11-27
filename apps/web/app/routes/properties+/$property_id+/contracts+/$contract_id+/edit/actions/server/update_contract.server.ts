import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { DateSchema } from "~/lib/date"
import { now } from "~/lib/now.server"
import { ForceNumberSchema } from "~/lib/force_number"

export async function update_contract(
  form_data: FormData,
  property_id: number,
) {
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  const start_date = v.parse(
    DateSchema,
    form_data.get("start_date"),
  )
  const end_date = v.parse(
    DateSchema,
    form_data.get("end_date"),
  )
  const escalation_type = v.parse(
    ForceNumberSchema,
    form_data.get("escalation_type"),
  )
  const escalation_duration = v.parse(
    v.string(),
    form_data.get("escalation_duration"),
  )
  const fine_type = v.parse(
    ForceNumberSchema,
    form_data.get("fine_type"),
  )
  const fine_amount = v.parse(
    ForceNumberSchema,
    form_data.get("fine_amount"),
  )
  const default_type = v.parse(
    ForceNumberSchema,
    form_data.get("default_type"),
  )
  const default_amount = v.parse(
    ForceNumberSchema,
    form_data.get("default_amount"),
  )
  const default_duration = v.parse(
    v.string(),
    form_data.get("default_duration"),
  )
  const early_termination = v.parse(
    ForceNumberSchema,
    form_data.get("early_termination"),
  )
  await query_builder
    .updateTable("contract")
    .set({
      property_id,
      updated_at: now,
      start_date,
      end_date,
      escalation_type,
      escalation_duration,
      fine_type,
      fine_amount,
      default_type,
      default_amount,
      default_duration,
      early_termination,
    })
    .where("contract.id", "=", id)
    .execute()
}
