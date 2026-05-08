import { randomUUID } from "node:crypto"
import { query_builder } from "../../../db/query_builder"

export async function add_team_member(
  team_id: string,
  user_id: number,
): Promise<string> {
  const now = new Date().toISOString()
  const id = randomUUID()
  await query_builder
    .insertInto("team_member")
    .values({
      id,
      team_id,
      user_id,
      created_at: now,
    })
    .execute()
  console.log(`added user ${user_id} to team ${team_id}`)
  return id
}
