import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { normalize_input } from "$lib/server/form"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  id: ForceNumberSchema,
})

export async function destroy_room(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        destroy_room: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [error] = await safe_async(
    query_builder
      .deleteFrom("room")
      .where("room.id", "=", input.id)
      .execute(),
  )
  if (error) {
    logger.error(
      error.message,
      { room_id: input.id },
      error,
    )
    return [
      {
        destroy_room: {
          execution: "Error al eliminar la habitación",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
