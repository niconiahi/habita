import { query_builder } from "../../../db/query_builder"

export async function create_receipt(
  contract_id: number,
  file_id: number,
  type: number,
): Promise<number> {
  const now = new Date().toISOString()
  const receipt = await query_builder
    .insertInto("receipt")
    .values({
      contract_id,
      file_id,
      type,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created receipt with id ${receipt.id}`)
  return receipt.id
}
