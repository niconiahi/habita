import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { normalize_input } from "$lib/server/form"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  email: v.pipe(v.string(), v.email()),
})

export async function invite_to_team(
  form_data: FormData,
  organization_id: string,
  team_id: string,
  inviter_id: number,
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

  const now = new Date()
  const invitation_id = crypto.randomUUID()
  const expires_at = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000,
  )

  try {
    await query_builder
      .insertInto("invitation")
      .values({
        id: invitation_id,
        organization_id,
        team_id,
        email: input.email,
        role: "manager",
        status: "pending",
        inviter_id,
        expires_at,
        created_at: now,
        updated_at: now,
      })
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        {
          email: input.email,
          organization_id,
          team_id,
          inviter_id,
        },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al enviar la invitacion",
    })
  }

  logger.info("invitation to team created", {
    organization_id,
    team_id,
    email: input.email,
  })
}
