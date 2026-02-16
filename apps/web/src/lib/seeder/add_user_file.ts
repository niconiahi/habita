import { query_builder } from "../../../db/query_builder"

export async function add_user_file(
  user_id: number,
  file_id: number,
  type: number,
): Promise<void> {
  const now = new Date().toISOString()
  await query_builder
    .insertInto("user_file")
    .values({
      user_id,
      file_id,
      type,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log(`added file ${file_id} to user ${user_id}`)
}
