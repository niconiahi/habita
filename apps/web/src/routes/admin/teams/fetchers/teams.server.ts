import { query_builder } from "db/query_builder"
import { sql } from "kysely"

export async function fetch_teams_with_member_counts(
  organization_id: string,
) {
  const teams = await query_builder
    .selectFrom("team")
    .leftJoin(
      "team_member",
      "team_member.team_id",
      "team.id",
    )
    .where("team.organization_id", "=", organization_id)
    .groupBy(["team.id", "team.name", "team.created_at"])
    .select([
      "team.id",
      "team.name",
      "team.created_at",
      sql<number>`count(team_member.id)::int`.as(
        "member_count",
      ),
    ])
    .orderBy("team.created_at", "asc")
    .execute()
  return teams
}

export type TeamRow = Awaited<
  ReturnType<typeof fetch_teams_with_member_counts>
>[number]
