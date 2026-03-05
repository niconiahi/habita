import { query_builder } from "db/query_builder"
import { now } from "$lib/server/now"
import { ROOM_TYPE } from "$lib/room_type"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

export async function create_room(property_id: number) {
  const [error] = await safe_async(
    query_builder
      .insertInto("room")
      .values({
        width: 0,
        length: 0,
        type: ROOM_TYPE.BEDROOM,
        updated_at: now,
        created_at: now,
        property_id,
      })
      .execute(),
  )
  if (error) {
    logger.error(error.message, { property_id }, error)
    return [
      {
        create_room: {
          execution: "Error al crear la habitación",
        },
      },
      null,
    ] as const
  }
  return [null, null] as const
}
