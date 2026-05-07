import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { auth } from "$lib/server/auth"
import { normalize_input } from "$lib/server/form"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  invitation_id: v.pipe(v.string(), v.uuid()),
})

export async function cancel_invitation(
  form_data: FormData,
  team_id: string,
  organization_id: string,
  headers: Headers,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  const invitation = await query_builder
    .selectFrom("invitation")
    .where("id", "=", input.invitation_id)
    .where("team_id", "=", team_id)
    .where("organization_id", "=", organization_id)
    .select(["id", "status"])
    .executeTakeFirst()

  if (!invitation) {
    return fail(404, {
      message: "Invitación no encontrada",
    })
  }

  if (invitation.status === "accepted") {
    return fail(400, {
      message: "Esta invitación ya fue aceptada.",
    })
  }
  if (invitation.status === "canceled") {
    return fail(400, {
      message: "Esta invitación ya fue cancelada.",
    })
  }
  if (invitation.status === "rejected") {
    return fail(400, {
      message: "Esta invitación ya fue rechazada.",
    })
  }

  try {
    await auth.api.cancelInvitation({
      body: { invitationId: input.invitation_id },
      headers,
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { invitation_id: input.invitation_id, team_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al cancelar la invitación",
    })
  }

  logger.info("invitation canceled", {
    invitation_id: input.invitation_id,
    team_id,
  })

  return { success: true }
}
