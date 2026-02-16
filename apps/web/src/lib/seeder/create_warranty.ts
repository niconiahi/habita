import { query_builder } from "../../../db/query_builder"

export async function create_warranty(
  type: string,
): Promise<number> {
  const now = new Date().toISOString()
  const warranty = await query_builder
    .insertInto("warranty")
    .values({
      type,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created warranty with id ${warranty.id}`)
  return warranty.id
}
