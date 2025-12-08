import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { DateSchema } from "~/lib/date"
import { now } from "~/lib/now.server"
import { ForceNumberSchema } from "~/lib/force_number"
import { normalize_input } from "~/lib/form.server"

export const InputSchema = v.object({
  id: ForceNumberSchema,
  start_date: v.optional(DateSchema),
  end_date: v.optional(DateSchema),
  escalation_type: v.optional(ForceNumberSchema),
  destiny: v.optional(ForceNumberSchema),
  escalation_duration: v.optional(v.string()),
  fine_percentage: v.optional(ForceNumberSchema),
  early_termination: v.optional(v.string()),
  property_type: v.optional(ForceNumberSchema),
  cbu: v.optional(v.string()),
  devoluciones_percentage: v.optional(ForceNumberSchema),
  muestra_horas: v.optional(ForceNumberSchema),
  tribunal: v.optional(ForceNumberSchema),
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
      early_termination: early_termination
        ? Number(early_termination)
        : undefined,
    })
    .where("contract.id", "=", id)
    .execute()
}
