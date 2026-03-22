import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { ForceNumberSchema } from "$lib/force_number"
import { RoomTypeSchema } from "$lib/room_type"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  id: ForceNumberSchema,
  length: ForceNumberSchema,
  width: ForceNumberSchema,
  type: v.pipe(
    v.string(),
    v.transform(Number),
    RoomTypeSchema,
  ),
})

export async function update_room(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        update_room: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [error] = await safe_async(
    query_builder
      .updateTable("room")
      .set({
        width: input.width,
        length: input.length,
        updated_at: new Date(),
        type: input.type,
      })
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
        update_room: {
          execution: "Error al actualizar la habitación",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
