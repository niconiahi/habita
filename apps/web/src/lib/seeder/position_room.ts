import { query_builder } from "../../../db/query_builder"

export async function position_room(
  room_id: number,
  data: {
    position_x: string
    position_y: string
  },
): Promise<void> {
  const now = new Date().toISOString()
  await query_builder
    .insertInto("room_map")
    .values({
      room_id,
      position_x: data.position_x,
      position_y: data.position_y,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log(
    `positioned room ${room_id} at (${data.position_x}, ${data.position_y})`,
  )
}
