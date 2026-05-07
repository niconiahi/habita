import { fail } from "@sveltejs/kit"
import * as v from "valibot"
import { auth } from "$lib/server/auth"
import { normalize_input } from "$lib/server/form"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  email: v.pipe(v.string(), v.email()),
})

export async function invite_to_team(
  form_data: FormData,
  organization_id: string,
  team_id: string,
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

  try {
    await auth.api.createInvitation({
      body: {
        email: input.email,
        organizationId: organization_id,
        teamId: team_id,
        role: "manager",
        resend: true,
      },
      headers,
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        {
          email: input.email,
          organization_id,
          team_id,
        },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al enviar la invitación",
    })
  }

  logger.info("invitation to team created", {
    organization_id,
    team_id,
    email: input.email,
  })

  return { success: true }
}
