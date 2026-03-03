import { query_builder } from "../../../db/query_builder"

export async function add_property_tag(
  property_id: number,
  type: number,
): Promise<number> {
  const now = new Date().toISOString()
  const property_tag = await query_builder
    .insertInto("property_tag")
    .values({
      property_id,
      type,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(
    `created property_tag with id ${property_tag.id}`,
  )
  return property_tag.id
}
