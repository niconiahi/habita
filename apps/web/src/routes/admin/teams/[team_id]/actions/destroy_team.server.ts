import { fail, redirect } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { sql } from "kysely"
import { auth } from "$lib/server/auth"
import { logger } from "$lib/telemetry/logger"

export async function destroy_team(
  team_id: string,
  headers: Headers,
) {
  const member_count = await query_builder
    .selectFrom("team_member")
    .where("team_id", "=", team_id)
    .select(sql<number>`count(*)::int`.as("count"))
    .executeTakeFirst()
  if ((member_count?.count ?? 0) > 0) {
    return fail(400, {
      message:
        "El equipo tiene miembros. Removelos antes de eliminarlo.",
    })
  }

  const pending_invitations = await query_builder
    .selectFrom("invitation")
    .where("team_id", "=", team_id)
    .where("status", "=", "pending")
    .select(["id"])
    .execute()

  for (const invitation of pending_invitations) {
    try {
      await auth.api.cancelInvitation({
        body: { invitationId: invitation.id },
        headers,
      })
    } catch (error) {
      if (error instanceof Error) {
        logger.error(
          error.message,
          {
            team_id,
            invitation_id: invitation.id,
          },
          error,
        )
      } else {
        logger.unknown(error)
      }
      return fail(400, {
        message: "Error al cancelar invitaciones del equipo",
      })
    }
  }

  try {
    await query_builder
      .deleteFrom("team")
      .where("id", "=", team_id)
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, { team_id }, error)
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al eliminar el equipo",
    })
  }

  logger.info("team destroyed", {
    team_id,
    canceled_invitations: pending_invitations.length,
  })
  redirect(303, "/admin/teams")
}
