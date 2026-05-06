import { randomUUID } from "node:crypto"
import { query_builder } from "../../../db/query_builder"

export async function create_team(
  organization_id: string,
  name: string,
): Promise<string> {
  const now = new Date().toISOString()
  const id = randomUUID()
  await query_builder
    .insertInto("team")
    .values({
      id,
      name,
      organization_id,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log(
    `created team "${name}" in organization ${organization_id}`,
  )
  return id
}
