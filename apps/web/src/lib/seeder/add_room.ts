import { query_builder } from "../../../db/query_builder"

export async function add_room(
  property_id: number,
  data: {
    type: number
    width: string
    length: string
  },
): Promise<number> {
  const now = new Date().toISOString()
  const room = await query_builder
    .insertInto("room")
    .values({
      property_id,
      type: data.type,
      width: data.width,
      length: data.length,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created room with id ${room.id}`)
  return room.id
}
