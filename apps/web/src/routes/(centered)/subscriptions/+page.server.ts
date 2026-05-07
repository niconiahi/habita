import { differenceInDays } from "date-fns"
import { require_authentication } from "$lib/server/auth"
import { resolve_subscription_status } from "$lib/server/subscription"
import {
  SUBSCRIPTION_STATUS,
  type SubscriptionStatus,
} from "$lib/subscription_status"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { create_subscription_payment } from "./actions/create_subscription_payment.server"

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
  url,
}) => {
  require_authentication(locals, url)

  return {
    subscriptions: locals.subscriptions.map(
      (subscription) => {
        const status = resolve_subscription_status(
          new Date(subscription.ends_at),
        )
        return {
          ...subscription,
          status,
          can_pay_next: can_pay_next(
            new Date(subscription.ends_at),
            status,
          ),
        }
      },
    ),
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
