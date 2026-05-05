import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { FloorNumberSchema } from "$lib/floor_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  id: ForceNumberSchema,
  number: v.pipe(
    v.string(),
    v.transform(Number),
    FloorNumberSchema,
  ),
})

export async function update_floor(form_data: FormData) {
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
      .updateTable("floor")
      .set({
        number: input.number,
        updated_at: now,
      })
      .where("floor.id", "=", input.id)
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { floor_id: input.id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al actualizar el piso",
    })
  }
}
