import { query_builder } from "db/query_builder"

export async function fetch_pending_team_invitations(
  team_id: string,
) {
  return query_builder
    .selectFrom("invitation")
    .where("team_id", "=", team_id)
    .where("status", "=", "pending")
    .where("expires_at", ">", new Date())
    .select(["id", "email", "expires_at"])
    .orderBy("created_at desc")
    .execute()
}

export type PendingTeamInvitation = Awaited<
  ReturnType<typeof fetch_pending_team_invitations>
>[number]
