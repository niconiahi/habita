import * as v from "valibot"
import { DateSchema } from "$lib/date"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"

export const InputSchema = v.object({
  id: ForceNumberSchema,
  start_date: v.optional(DateSchema),
  end_date: v.optional(DateSchema),
  escalation_type: v.optional(ForceNumberSchema),
  destiny: v.optional(ForceNumberSchema),
  escalation_duration: v.optional(v.string()),
  fine_percentage: v.optional(ForceNumberSchema),
  early_termination: v.optional(ForceNumberSchema),
  property_type: v.optional(ForceNumberSchema),
  cbu: v.optional(v.string()),
  percentage_return: v.optional(ForceNumberSchema),
  showroom_hours: v.optional(ForceNumberSchema),
  court_id: v.optional(ForceNumberSchema),
})

export async function update_contract(
  form_data: FormData,
  property_id: number,
) {
  const {
    id,
    start_date,
    end_date,
    escalation_type,
    escalation_duration,
    fine_percentage,
    early_termination,
    destiny,
    cbu,
    percentage_return,
    showroom_hours,
    court_id,
  } = v.parse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  await query_builder
    .updateTable("contract")
    .set({
      property_id,
      start_date,
      end_date,
      destiny,
      escalation_type,
      escalation_duration,
      updated_at: now,
      fine_amount: fine_percentage,
      early_termination,
      cbu,
      percentage_return,
      showroom_hours,
      court_id,
    })
    .where("contract.id", "=", id)
    .execute()
}
