import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { auth } from "$lib/server/auth"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { invalidate_user_subscriptions_cache } from "$lib/server/subscription"
import { SUBSCRIPTION_STATUS } from "$lib/subscription_status"
import {
  SUBSCRIPTION_TYPE,
  SubscriptionTypeSchema,
} from "$lib/subscription_type"
import { logger } from "$lib/telemetry/logger"

const TRIAL_PERIOD_DAYS = 30

const InputSchema = v.object({
  type: v.pipe(ForceNumberSchema, SubscriptionTypeSchema),
})

export async function create_account(
  form_data: FormData,
  user_id: number,
  user_email: string,
  request_headers: Headers,
) {
  const input = normalize_input(form_data, InputSchema)
  const result = v.safeParse(InputSchema, input)
  if (!result.success) {
    return [
      {
        create_account: {
          input: v.flatten(result.issues),
        },
      },
      null,
    ] as const
  }

  if (result.output.type === SUBSCRIPTION_TYPE.FREELANCE) {
    const existing_freelance = await query_builder
      .selectFrom("member")
      .innerJoin(
        "subscription",
        "subscription.organization_id",
        "member.organization_id",
      )
      .where("member.user_id", "=", user_id)
      .where(
        "subscription.type",
        "=",
        SUBSCRIPTION_TYPE.FREELANCE,
      )
      .select("subscription.id")
      .executeTakeFirst()

    if (existing_freelance) {
      return [
        {
          create_account: {
            execution:
              "Ya tenés una cuenta de asesor",
          },
        },
        null,
      ] as const
    }
  }

  const organization_name =
    result.output.type === SUBSCRIPTION_TYPE.FREELANCE
      ? "Personal"
      : `La inmobiliaria de ${user_email}`

  const [organization_error, organization] =
    await safe_async(
      auth.api.createOrganization({
        body: {
          name: organization_name,
          slug: crypto.randomUUID(),
          userId: String(user_id),
        },
      }),
    )
  if (organization_error || !organization) {
    if (organization_error) {
      logger.error(
        "failed to create organization",
        { user_id },
        organization_error,
      )
    }
    return [
      {
        create_account: {
          execution: "Error al crear la organización",
        },
      },
      null,
    ] as const
  }

  const period_start = new Date(now)
  const period_end = new Date(now)
  period_end.setDate(
    period_end.getDate() + TRIAL_PERIOD_DAYS,
  )

  const [subscription_error] = await safe_async(
    query_builder
      .insertInto("subscription")
      .values({
        organization_id: organization.id,
        user_id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        type: result.output.type,
        starts_at: period_start.toISOString(),
        ends_at: period_end.toISOString(),
        created_at: now,
        updated_at: now,
      })
      .execute(),
  )
  if (subscription_error) {
    logger.error(
      "failed to create subscription",
      { user_id },
      subscription_error,
    )
    return [
      {
        create_account: {
          execution: "Error al crear la suscripción",
        },
      },
      null,
    ] as const
  }

  const [active_organization_error] = await safe_async(
    auth.api.setActiveOrganization({
      body: { organizationId: organization.id },
      headers: request_headers,
    }),
  )
  if (active_organization_error) {
    logger.error(
      "failed to set active organization",
      {
        user_id,
        organization_id: organization.id,
      },
      active_organization_error,
    )
  }

  const [cache_error] = await safe_async(
    invalidate_user_subscriptions_cache(user_id),
  )
  if (cache_error) {
    logger.error(
      "failed to invalidate subscriptions cache",
      { user_id },
      cache_error,
    )
  }

  return [
    null,
    { redirect_path: "/admin/settings" },
  ] as const
}
