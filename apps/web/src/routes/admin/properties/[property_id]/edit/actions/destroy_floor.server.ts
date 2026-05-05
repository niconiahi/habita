import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { FLOOR_NUMBER } from "$lib/floor_number"
import { normalize_input } from "$lib/server/form"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  id: ForceNumberSchema,
})

export async function destroy_floor(form_data: FormData) {
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

  let floor: { number: number }
  try {
    floor = await query_builder
      .selectFrom("floor")
      .select(["floor.number"])
      .where("floor.id", "=", input.id)
      .executeTakeFirstOrThrow()
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
      message: "Error al buscar el piso",
    })
  }

  if (floor.number === FLOOR_NUMBER.GROUND) {
    return fail(400, {
      message: "No se puede eliminar la planta baja",
    })
  }

  try {
    await query_builder
      .deleteFrom("floor")
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
      message: "Error al eliminar el piso",
    })
  }
}
