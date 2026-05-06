import { query_builder } from "db/query_builder"

export async function fetch_team(
  team_id: string,
  organization_id: string,
) {
  return query_builder
    .selectFrom("team")
    .where("id", "=", team_id)
    .where("organization_id", "=", organization_id)
    .select(["id", "name", "organization_id", "created_at"])
    .executeTakeFirst()
}

export type Team = NonNullable<
  Awaited<ReturnType<typeof fetch_team>>
>
