import * as v from "valibot"
import { sql } from "kysely"
import { query_builder } from "db/query_builder"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
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
    .where(
      "subscription_id",
      "=",
      subscription.id,
    )
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
    return [
      {
        invite_manager: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
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
      return [
        {
          invite_manager: {
            execution:
              "Durante el período de prueba solo podés tener 1 administrador",
          },
        },
        null,
      ] as const
    }
  }

  const now = new Date()
  const invitation_id = crypto.randomUUID()
  const expires_at = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000,
  ) // 7 days

  const [error] = await safe_async(
    query_builder
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
      .execute(),
  )
  if (error) {
    logger.error(
      error.message,
      { email: input.email, organization_id, inviter_id },
      error,
    )
    return [
      {
        invite_manager: {
          execution: "Error al enviar la invitación",
        },
      },
      null,
    ] as const
  }

  // TODO: Send invitation email

  logger.info("manager invited to organization", {
    organization_id,
    email: input.email,
  })

  return [null, null] as const
}
