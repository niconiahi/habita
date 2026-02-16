import { randomUUID } from "node:crypto"
import { query_builder } from "../../../db/query_builder"

export async function create_organization(
  name: string,
): Promise<string> {
  const now = new Date().toISOString()
  const id = randomUUID()
  await query_builder
    .insertInto("organization")
    .values({
      id,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log(`created organization ${id}`)
  return id
}
