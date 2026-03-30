import { query_builder } from "../../../db/query_builder"

export async function add_floor(
  property_id: number,
  data: {
    number: number
  },
): Promise<number> {
  const now = new Date().toISOString()
  const floor = await query_builder
    .insertInto("floor")
    .values({
      property_id,
      number: data.number,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created floor with id ${floor.id}`)
  return floor.id
}
