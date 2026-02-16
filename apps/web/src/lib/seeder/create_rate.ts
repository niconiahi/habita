import { query_builder } from "../../../db/query_builder"

export async function create_rate(data: {
  type: number
  month: number
  year: number
  value: string
}): Promise<number> {
  const now = new Date().toISOString()
  const rate = await query_builder
    .insertInto("rate")
    .values({
      type: data.type,
      month: data.month,
      year: data.year,
      value: data.value,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created rate with id ${rate.id}`)
  return rate.id
}
