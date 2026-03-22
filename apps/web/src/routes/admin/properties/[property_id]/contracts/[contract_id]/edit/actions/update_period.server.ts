import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  id: ForceNumberSchema,
  price: ForceNumberSchema,
})

export async function update_period(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        update_period: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [error] = await safe_async(
    query_builder
      .updateTable("period")
      .set({
        price: input.price,
        updated_at: now,
      })
      .where("period.id", "=", input.id)
      .execute(),
  )
  if (error) {
    logger.error(
      error.message,
      { period_id: input.id },
      error,
    )
    return [
      {
        update_period: {
          execution: "Error al actualizar el período",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
