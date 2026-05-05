import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
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
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  try {
    await query_builder
      .updateTable("property")
      .set({
        construction_year: input.construction_year ?? null,
        updated_at: now,
      })
      .where("property.id", "=", property_id)
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        {
          property_id,
          construction_year: input.construction_year,
        },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message:
        "Error al actualizar el año de construcción",
    })
  }
}
