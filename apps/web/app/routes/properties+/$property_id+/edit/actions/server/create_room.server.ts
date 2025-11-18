import { query_builder } from "db/query_builder"
import { now } from "~/lib/now.server"
import { ROOM_TYPE } from "~/lib/room_type.server"

export async function create_room(property_id: number) {
  await query_builder
    .insertInto("room")
    .values({
      width: 0,
      length: 0,
      type: ROOM_TYPE.BEDROOM,
      updated_at: now,
      created_at: now,
      property_id,
    })
    .execute()
}
