import { query_builder } from "../../../db/query_builder"

export async function add_contract_file(
  contract_id: number,
  file_id: number,
  type: number,
): Promise<void> {
  const now = new Date().toISOString()
  await query_builder
    .insertInto("contract_file")
    .values({
      contract_id,
      file_id,
      type,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log(
    `added file ${file_id} to contract ${contract_id}`,
  )
}
