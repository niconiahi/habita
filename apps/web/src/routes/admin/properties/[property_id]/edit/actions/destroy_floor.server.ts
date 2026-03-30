import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { FLOOR_NUMBER } from "$lib/floor_number"
import { safe_async } from "$lib/safe_async"
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
    return [
      {
        destroy_floor: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [fetch_error, floor] = await safe_async(
    query_builder
      .selectFrom("floor")
      .select(["floor.number"])
      .where("floor.id", "=", input.id)
      .executeTakeFirstOrThrow(),
  )
  if (fetch_error) {
    logger.error(
      fetch_error.message,
      { floor_id: input.id },
      fetch_error,
    )
    return [
      {
        destroy_floor: {
          execution: "Error al buscar el piso",
        },
      },
      null,
    ] as const
  }

  if (floor.number === FLOOR_NUMBER.GROUND) {
    return [
      {
        destroy_floor: {
          execution: "No se puede eliminar la planta baja",
        },
      },
      null,
    ] as const
  }

  const [error] = await safe_async(
    query_builder
      .deleteFrom("floor")
      .where("floor.id", "=", input.id)
      .execute(),
  )
  if (error) {
    logger.error(
      error.message,
      { floor_id: input.id },
      error,
    )
    return [
      {
        destroy_floor: {
          execution: "Error al eliminar el piso",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
