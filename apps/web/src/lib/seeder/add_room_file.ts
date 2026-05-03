import { query_builder } from "../../../db/query_builder"

export async function add_room_file(
  room_id: number,
  file_id: number,
): Promise<void> {
  const now = new Date().toISOString()
  await query_builder
    .insertInto("room_file")
    .values({
      room_id,
      file_id,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log(`added file ${file_id} to room ${room_id}`)
}
