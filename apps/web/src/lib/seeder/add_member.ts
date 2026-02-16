import { randomUUID } from "node:crypto"
import { query_builder } from "../../../db/query_builder"

export async function add_member(
  organization_id: string,
  user_id: number,
  role: string,
): Promise<string> {
  const now = new Date().toISOString()
  const id = randomUUID()
  await query_builder
    .insertInto("member")
    .values({
      id,
      organization_id,
      user_id,
      role,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log(
    `added user ${user_id} as ${role} to organization ${organization_id}`,
  )
  return id
}
