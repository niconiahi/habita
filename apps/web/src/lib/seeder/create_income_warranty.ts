import { query_builder } from "../../../db/query_builder"

export async function create_income_warranty(
  warranty_id: number,
): Promise<number> {
  const now = new Date().toISOString()
  const income_warranty = await query_builder
    .insertInto("income_warranty")
    .values({
      warranty_id,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(
    `created income_warranty with id ${income_warranty.id}`,
  )
  return income_warranty.id
}
