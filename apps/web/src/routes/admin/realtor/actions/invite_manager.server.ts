import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { sql } from "kysely"
import * as v from "valibot"
import { normalize_input } from "$lib/server/form"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  email: v.pipe(v.string(), v.email()),
})

async function is_trial(organization_id: string) {
  const subscription = await query_builder
    .selectFrom("subscription")
    .where("organization_id", "=", organization_id)
    .select("id")
    .executeTakeFirst()
  if (!subscription) return false

  const payment = await query_builder
    .selectFrom("subscription_payment")
    .where("subscription_id", "=", subscription.id)
    .select("id")
    .executeTakeFirst()
  return !payment
}

export async function invite_manager(
  form_data: FormData,
  organization_id: string,
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

  const trial = await is_trial(organization_id)
  if (trial) {
    const result = await query_builder
      .selectFrom("member")
      .where("organization_id", "=", organization_id)
      .select(sql<number>`count(*)::int`.as("count"))
      .executeTakeFirst()
    const member_count = result?.count ?? 0
    if (member_count >= 2) {
      return fail(400, {
        message:
          "Durante el período de prueba solo podés tener 1 administrador",
      })
    }
  }

  const now = new Date()
  const invitation_id = crypto.randomUUID()
  const expires_at = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000,
  ) // 7 days

  try {
    await query_builder
      .insertInto("invitation")
      .values({
        id: invitation_id,
        organization_id,
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
        { email: input.email, organization_id, inviter_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al enviar la invitación",
    })
  }

  // TODO: Send invitation email

  logger.info("manager invited to organization", {
    organization_id,
    email: input.email,
  })
}
