import * as v from "valibot"
import { DateSchema } from "$lib/date"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

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
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        update_contract: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [error] = await safe_async(
    query_builder
      .updateTable("contract")
      .set({
        property_id,
        start_date: input.start_date,
        end_date: input.end_date,
        destiny: input.destiny,
        escalation_type: input.escalation_type,
        escalation_duration: input.escalation_duration,
        updated_at: now,
        fine_amount: input.fine_percentage,
        early_termination: input.early_termination,
        cbu: input.cbu,
        percentage_return: input.percentage_return,
        showroom_hours: input.showroom_hours,
        court_id: input.court_id,
      })
      .where("contract.id", "=", input.id)
      .execute(),
  )
  if (error) {
    logger.error(error.message, { property_id, contract_id: input.id }, error)
    return [
      {
        update_contract: {
          execution: "Error al actualizar el contrato",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
