import { query_builder } from "../../../db/query_builder"

export async function add_contract_item(
  contract_id: number,
  data: {
    name: string
    state: number
  },
): Promise<number> {
  const now = new Date().toISOString()
  const item = await query_builder
    .insertInto("contract_item")
    .values({
      contract_id,
      name: data.name,
      state: data.state,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created contract_item with id ${item.id}`)
  return item.id
}
