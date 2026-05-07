import { redirect } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { auth } from "$lib/server/auth"
import { logger } from "$lib/telemetry/logger"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  params,
  locals,
  request,
}) => {
  const invitation_id = params.invitation_id

  if (!locals.user) {
    const redirect_to = `/invitations/${invitation_id}/accept`
    redirect(
      302,
      `/login?redirect_to=${encodeURIComponent(redirect_to)}`,
    )
  }

  const invitation = await query_builder
    .selectFrom("invitation")
    .where("id", "=", invitation_id)
    .select([
      "id",
      "email",
      "status",
      "expires_at",
      "team_id",
      "organization_id",
    ])
    .executeTakeFirst()

  if (!invitation) {
    return { state: "not_found" as const }
  }

  if (invitation.status === "accepted") {
    if (invitation.team_id) {
      redirect(303, `/admin/teams/${invitation.team_id}`)
    }
    redirect(303, "/admin/teams")
  }

  if (invitation.status === "canceled") {
    return { state: "canceled" as const }
  }

  if (invitation.status === "rejected") {
    return { state: "rejected" as const }
  }

  if (invitation.expires_at <= new Date()) {
    return { state: "expired" as const }
  }

  if (invitation.email !== locals.user.email) {
    return {
      state: "mismatch" as const,
      invited_email: invitation.email,
    }
  }

  try {
    await auth.api.acceptInvitation({
      body: { invitationId: invitation_id },
      headers: request.headers,
    })
    await auth.api.setActiveOrganization({
      body: { organizationId: invitation.organization_id },
      headers: request.headers,
    })
  } catch (accept_error) {
    if (accept_error instanceof Error) {
      logger.error(
        "invitation accept failed",
        {
          invitation_id,
          user_id: locals.user.id,
        },
        accept_error,
      )
    } else {
      logger.unknown(accept_error)
    }
    return { state: "error" as const }
  }

  logger.info("invitation accepted", {
    invitation_id,
    user_id: locals.user.id,
    organization_id: invitation.organization_id,
  })

  if (invitation.team_id) {
    redirect(303, `/admin/teams/${invitation.team_id}`)
  }
  redirect(303, "/admin/teams")
}
