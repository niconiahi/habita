import { query_builder } from "db/query_builder"
import { sql } from "kysely"
import { ACCESS_TYPE } from "$lib/access_type"
import { decrypt } from "$lib/server/encryption"

export async function fetch_team_members_with_property_counts(
  team_id: string,
) {
  const members = await query_builder
    .selectFrom("team_member")
    .innerJoin("user", "user.id", "team_member.user_id")
    .where("team_member.team_id", "=", team_id)
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.email",
      "team_member.created_at as joined_at",
    ])
    .execute()
  return Promise.all(
    members.map(async (member) => {
      const result = await query_builder
        .selectFrom("property_access")
        .where("user_id", "=", member.id)
        .where("type", "=", ACCESS_TYPE.MANAGER)
        .select(sql<number>`count(*)::int`.as("count"))
        .executeTakeFirst()
      return {
        ...member,
        name: member.name ? decrypt(member.name) : null,
        surname: member.surname
          ? decrypt(member.surname)
          : null,
        property_count: result?.count ?? 0,
      }
    }),
  )
}

export type TeamMember = Awaited<
  ReturnType<typeof fetch_team_members_with_property_counts>
>[number]
