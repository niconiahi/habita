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
      "user.document_number",
      "user.cuil",
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
    document_number: candidate.document_number
      ? decrypt(candidate.document_number)
      : null,
    cuil: candidate.cuil ? decrypt(candidate.cuil) : null,
  }
}

export function fetch_candidate_files(user_id: number) {
  return query_builder
    .selectFrom("user_file")
    .innerJoin("file", "file.id", "user_file.file_id")
    .where("user_file.user_id", "=", user_id)
    .select(["file.id", "file.basename", "user_file.type"])
    .execute()
}
export type Candidate = NonNullable<
  Awaited<ReturnType<typeof fetch_candidate>>
>
