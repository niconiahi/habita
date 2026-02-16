import { query_builder } from "../../../db/query_builder"

export async function add_service(
  property_id: number,
  data: {
    type: number
    code: string
  },
): Promise<number> {
  const now = new Date().toISOString()
  const service = await query_builder
    .insertInto("service")
    .values({
      property_id,
      type: data.type,
      code: data.code,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created service with id ${service.id}`)
  return service.id
}
