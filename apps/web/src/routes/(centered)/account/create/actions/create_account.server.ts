import { fail, redirect } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
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
    return fail(400, {
      errors: v.flatten(result.issues),
    })
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
      return fail(400, {
        message: "Ya tenés una cuenta de asesor",
      })
    }
  }

  const organization_name =
    result.output.type === SUBSCRIPTION_TYPE.FREELANCE
      ? "Personal"
      : `La inmobiliaria de ${user_email}`

  let organization: Awaited<
    ReturnType<typeof auth.api.createOrganization>
  >
  try {
    organization = await auth.api.createOrganization({
      body: {
        name: organization_name,
        slug: crypto.randomUUID(),
        userId: String(user_id),
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, { user_id }, error)
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al crear la organización",
    })
  }
  if (!organization) {
    return fail(400, {
      message: "Error al crear la organización",
    })
  }

  if (result.output.type === SUBSCRIPTION_TYPE.FREELANCE) {
    try {
      await query_builder
        .updateTable("member")
        .set({ role: "manager", updated_at: now })
        .where("organization_id", "=", organization.id)
        .where("user_id", "=", user_id)
        .execute()
    } catch (error) {
      if (error instanceof Error) {
        logger.error(
          error.message,
          { user_id, organization_id: organization.id },
          error,
        )
      } else {
        logger.unknown(error)
      }
      return fail(400, {
        message: "Error al asignar el rol",
      })
    }
  }

  const period_start = new Date(now)
  const period_end = new Date(now)
  period_end.setDate(
    period_end.getDate() + TRIAL_PERIOD_DAYS,
  )

  try {
    await query_builder
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
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, { user_id }, error)
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al crear la suscripción",
    })
  }

  try {
    await auth.api.setActiveOrganization({
      body: { organizationId: organization.id },
      headers: request_headers,
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        {
          user_id,
          organization_id: organization.id,
        },
        error,
      )
    } else {
      logger.unknown(error)
    }
  }

  try {
    await invalidate_user_subscriptions_cache(user_id)
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, { user_id }, error)
    } else {
      logger.unknown(error)
    }
  }

  redirect(303, "/admin")
}
