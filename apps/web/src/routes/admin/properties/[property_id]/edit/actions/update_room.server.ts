import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { RoomTypeSchema } from "$lib/room_type"
import { normalize_input } from "$lib/server/form"
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
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  try {
    await query_builder
      .updateTable("room")
      .set({
        width: input.width,
        length: input.length,
        updated_at: new Date(),
        type: input.type,
      })
      .where("room.id", "=", input.id)
      .execute()
  } catch (error) {
    const typed_error =
      error instanceof Error
        ? error
        : new Error("unknown error")
    logger.error(
      typed_error.message,
      { room_id: input.id },
      typed_error,
    )
    return fail(400, {
      message: "Error al actualizar la habitación",
    })
  }
}
