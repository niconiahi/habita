import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { SUBSCRIPTION_STATUS } from "$lib/subscription_status"
import { SubscriptionTypeSchema } from "$lib/subscription_type"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  type: v.pipe(ForceNumberSchema, SubscriptionTypeSchema),
})

export async function select_account_type(
  form_data: FormData,
  user_id: number,
) {
  const input = normalize_input(form_data, InputSchema)
  const result = v.safeParse(InputSchema, input)
  if (!result.success) {
    return [
      {
        select_account_type: {
          input: v.flatten(result.issues),
        },
      },
      null,
    ] as const
  }

  const personal_organization = await query_builder
    .selectFrom("organization")
    .where("slug", "=", `personal-${user_id}`)
    .select("id")
    .executeTakeFirst()

  if (!personal_organization) {
    return [
      {
        select_account_type: {
          execution:
            "No se encontró la organización personal",
        },
      },
      null,
    ] as const
  }

  const period_start = new Date(now)
  const period_end = new Date(now)
  period_end.setDate(period_end.getDate() + 30)

  const [transaction_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      await tx
        .insertInto("subscription")
        .values({
          organization_id: personal_organization.id,
          user_id,
          status: SUBSCRIPTION_STATUS.ACTIVE,
          type: result.output.type,
          starts_at: period_start.toISOString(),
          ends_at: period_end.toISOString(),
          created_at: now,
          updated_at: now,
        })
        .execute()
    }),
  )
  if (transaction_error) {
    logger.error(
      "failed to create subscription",
      { user_id },
      transaction_error,
    )
    return [
      {
        select_account_type: {
          execution: "Error al crear la suscripción",
        },
      },
      null,
    ] as const
  }

  const redirect_path = "/admin/properties"

  return [null, { redirect_path }] as const
}
