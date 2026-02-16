import { query_builder } from "../../../db/query_builder"

export async function create_property(data: {
  location_id: number
  state: number
  type: number
  unit?: string
  destinies: number[]
}): Promise<number> {
  const now = new Date().toISOString()
  const property = await query_builder
    .insertInto("property")
    .values({
      location_id: data.location_id,
      state: data.state,
      type: data.type,
      unit: data.unit,
      destinies: data.destinies,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created property with id ${property.id}`)
  return property.id
}
