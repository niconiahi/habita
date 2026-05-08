import { query_builder } from "db/query_builder"
import { logger } from "$lib/telemetry/logger"
import { auth } from "./auth"

export async function auto_accept_pending_invitations(
  user_id: number,
  email: string,
  headers: Headers,
): Promise<{ accepted: boolean }> {
  const existing_member = await query_builder
    .selectFrom("member")
    .where("user_id", "=", user_id)
    .select("id")
    .limit(1)
    .executeTakeFirst()
  if (existing_member) {
    return { accepted: false }
  }

  const pending = await query_builder
    .selectFrom("invitation")
    .where("email", "=", email)
    .where("status", "=", "pending")
    .where("expires_at", ">", new Date())
    .orderBy("created_at", "desc")
    .select(["id", "organization_id"])
    .execute()
  if (pending.length === 0) {
    return { accepted: false }
  }

  let last_organization_id: string | null = null
  for (const invitation of pending) {
    try {
      await auth.api.acceptInvitation({
        body: { invitationId: invitation.id },
        headers,
      })
      last_organization_id = invitation.organization_id
    } catch (error) {
      if (error instanceof Error) {
        logger.error(
          "auto-accept failed for invitation",
          { invitation_id: invitation.id, user_id },
          error,
        )
      } else {
        logger.unknown(error)
      }
    }
  }

  if (last_organization_id) {
    try {
      await auth.api.setActiveOrganization({
        body: { organizationId: last_organization_id },
        headers,
      })
    } catch (error) {
      if (error instanceof Error) {
        logger.error(
          "auto-accept setActiveOrganization failed",
          {
            user_id,
            organization_id: last_organization_id,
          },
          error,
        )
      } else {
        logger.unknown(error)
      }
    }
  }

  return { accepted: last_organization_id !== null }
}
