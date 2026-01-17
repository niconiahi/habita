import { query_builder } from "db/query_builder"
import { decrypt } from "$lib/server/encryption"

export async function fetch_candidate(id: number) {
  const candidate = await query_builder
    .selectFrom("user")
    .where("user.id", "=", id)
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.email",
      "user.phone_number",
    ])
    .executeTakeFirst()
  if (!candidate) return undefined
  return {
    ...candidate,
    name: decrypt(candidate.name),
    surname: decrypt(candidate.surname),
    phone_number: candidate.phone_number
      ? decrypt(candidate.phone_number)
      : null,
  }
}
export type Candidate = NonNullable<
  Awaited<ReturnType<typeof fetch_candidate>>
>
