import { query_builder } from "~/lib/query_builder.server"

export async function fetch_candidate(id: number) {
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
