import { query_builder } from "db/query_builder"
import { decrypt } from "$lib/server/encryption"

export async function fetch_team_member(
  team_id: string,
  user_id: number,
) {
  const member = await query_builder
    .selectFrom("team_member")
    .innerJoin("user", "user.id", "team_member.user_id")
    .where("team_member.team_id", "=", team_id)
    .where("team_member.user_id", "=", user_id)
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.email",
    ])
    .executeTakeFirst()
  if (!member) return null
  return {
    ...member,
    name: member.name ? decrypt(member.name) : null,
    surname: member.surname
      ? decrypt(member.surname)
      : null,
  }
}

export async function fetch_team_peers(
  team_id: string,
  exclude_user_id: number,
) {
  const peers = await query_builder
    .selectFrom("team_member")
    .innerJoin("user", "user.id", "team_member.user_id")
    .where("team_member.team_id", "=", team_id)
    .where("team_member.user_id", "!=", exclude_user_id)
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.email",
    ])
    .execute()
  return peers.map((peer) => ({
    ...peer,
    name: peer.name ? decrypt(peer.name) : null,
    surname: peer.surname ? decrypt(peer.surname) : null,
  }))
}

export type TeamPeer = Awaited<
  ReturnType<typeof fetch_team_peers>
>[number]
