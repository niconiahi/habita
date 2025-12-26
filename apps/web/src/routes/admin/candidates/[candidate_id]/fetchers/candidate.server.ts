import { query_builder } from "db/query_builder"

export function fetch_candidate(id: number) {
  return query_builder
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
}
export type Candidate = NonNullable<
  Awaited<ReturnType<typeof fetch_candidate>>
>
