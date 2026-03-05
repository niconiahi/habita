import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { now } from "$lib/server/now"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

export const InputSchema = v.object({
  construction_year: v.optional(ForceNumberSchema),
})

export async function update_construction_year(
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
        update_construction_year: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [error] = await safe_async(
    query_builder
      .updateTable("property")
      .set({
        construction_year: input.construction_year ?? null,
        updated_at: now,
      })
      .where("property.id", "=", property_id)
      .execute(),
  )
  if (error) {
    logger.error(error.message, { property_id, construction_year: input.construction_year }, error)
    return [
      {
        update_construction_year: {
          execution:
            "Error al actualizar el año de construcción",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
