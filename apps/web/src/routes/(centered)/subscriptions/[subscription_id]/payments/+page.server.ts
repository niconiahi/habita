import { error } from "@sveltejs/kit"
import { differenceInDays } from "date-fns"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_authentication } from "$lib/server/auth"
import {
  fetch_subscription_payments,
  resolve_subscription_status,
} from "$lib/server/subscription"
import {
  SUBSCRIPTION_STATUS,
  type SubscriptionStatus,
} from "$lib/subscription_status"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { create_subscription_payment } from "../../actions/create_subscription_payment.server"

// TEMP: 31 for testing, revert to 7 once flow is verified end-to-end.
const PAY_WINDOW_DAYS = 31

function can_pay_next(
  ends_at: Date,
  status: SubscriptionStatus,
): boolean {
  if (status !== SUBSCRIPTION_STATUS.ACTIVE) {
    return true
  }
  return (
    differenceInDays(ends_at, new Date()) <= PAY_WINDOW_DAYS
  )
}

export const load: PageServerLoad = async ({
  locals,
  params,
  url,
}) => {
  require_authentication(locals, url)

  const subscription_id = v.parse(
    ForceNumberSchema,
    params.subscription_id,
  )

  const subscription = locals.subscriptions.find(
    (s) => s.id === subscription_id,
  )
  if (!subscription) {
    error(404, "Suscripción no encontrada")
  }

  const status = resolve_subscription_status(
    new Date(subscription.ends_at),
  )

  const payments = await fetch_subscription_payments([
    subscription_id,
  ])

  return {
    subscription: {
      ...subscription,
      status,
      can_pay_next: can_pay_next(
        new Date(subscription.ends_at),
        status,
      ),
    },
    payments,
  }
}

export const actions: Actions = {
  [ACTION.CREATE_SUBSCRIPTION_PAYMENT]: async ({
    locals,
    request,
  }) => {
    require_authentication(locals)
    return create_subscription_payment(
      await request.formData(),
      locals.subscriptions,
    )
  },
}
