// NOTE: this schema is duplicated in apps/{web,broker}/. Keep both in sync when changing.
import * as v from "valibot"

export const EXTEND_SUBSCRIPTION_TOPIC =
  "extend_subscription"

export const ExtendSubscriptionEvent = v.object({
  subscription_payment_id: v.number(),
})

export type ExtendSubscriptionEvent = v.InferOutput<
  typeof ExtendSubscriptionEvent
>
