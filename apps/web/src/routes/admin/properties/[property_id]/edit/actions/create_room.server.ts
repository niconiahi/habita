import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { ROOM_TYPE } from "$lib/room_type"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"

export async function create_room(floor_id: number) {
  try {
    await query_builder
      .insertInto("room")
      .values({
        width: 0,
        length: 0,
        type: ROOM_TYPE.BEDROOM,
        updated_at: now,
        created_at: now,
        floor_id,
      })
      .execute()
  } catch (error) {
    const typed_error =
      error instanceof Error
        ? error
        : new Error("unknown error")
    logger.error(
      typed_error.message,
      { floor_id },
      typed_error,
    )
    return fail(400, {
      message: "Error al crear la habitación",
    })
  }
}
