import { query_builder } from "../../../db/query_builder"

export async function add_contract_item_file(
  contract_item_id: number,
  file_id: number,
): Promise<void> {
  const now = new Date().toISOString()
  await query_builder
    .insertInto("contract_item_file")
    .values({
      contract_item_id,
      file_id,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log(
    `added file ${file_id} to contract_item ${contract_item_id}`,
  )
}
