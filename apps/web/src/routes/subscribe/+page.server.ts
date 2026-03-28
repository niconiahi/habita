import { error, redirect } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import {
  fetch_organization_subscriptions,
  resolve_subscription_status,
} from "$lib/server/subscription"
import { SUBSCRIPTION_TYPE } from "$lib/subscription_type"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { create_subscription_payment } from "./actions/create_subscription_payment.server"

const FREELANCE_PRICE_USD = 50
const REALTOR_SEAT_PRICE_USD = 40

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/login")
  }

  const active_organization_id =
    locals.session?.activeOrganizationId ?? null

  const subscription = locals.subscriptions.find(
    (s) => s.organization_id === active_organization_id,
  )

  if (!subscription) {
    return {
      has_subscription: false,
      is_admin: false,
    }
  }

  const status = resolve_subscription_status(
    new Date(subscription.ends_at),
  )

  const organization_subscriptions =
    await fetch_organization_subscriptions(
      subscription.organization_id,
    )
  const seat_count = organization_subscriptions.length

  const amount =
    subscription.type === SUBSCRIPTION_TYPE.FREELANCE
      ? FREELANCE_PRICE_USD
      : seat_count * REALTOR_SEAT_PRICE_USD

  const is_admin = await query_builder
    .selectFrom("member")
    .where(
      "organization_id",
      "=",
      subscription.organization_id,
    )
    .where("user_id", "=", locals.user.id)
    .where("role", "in", ["realtor", "manager"])
    .select("id")
    .executeTakeFirst()

  return {
    has_subscription: true,
    status,
    ends_at: subscription.ends_at,
    amount,
    seat_count,
    is_admin: !!is_admin,
    subscription_type: subscription.type,
  }
}

export const actions: Actions = {
  [ACTION.CREATE_SUBSCRIPTION_PAYMENT]: async ({
    locals,
  }) => {
    if (!locals.user) {
      redirect(302, "/login")
    }
    const active_organization_id =
      locals.session?.activeOrganizationId
    if (!active_organization_id) {
      error(400, "No hay organización activa")
    }

    const [errors, data] =
      await create_subscription_payment(
        active_organization_id,
      )
    if (errors) {
      return { errors }
    }
    redirect(303, data.init_point)
  },
}
