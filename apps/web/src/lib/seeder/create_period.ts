import { query_builder } from "../../../db/query_builder"

export async function create_period(
  contract_id: number,
  data: {
    price: number
    start_date: Date
    end_date: Date
  },
): Promise<number> {
  const now = new Date().toISOString()
  const period = await query_builder
    .insertInto("period")
    .values({
      contract_id,
      price: data.price,
      start_date: data.start_date,
      end_date: data.end_date,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created period with id ${period.id}`)
  return period.id
}
