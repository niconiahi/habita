import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 0,
  GRACE: 1,
  LOCKED: 2,
} as const
export const SubscriptionStatusSchema = v.picklist(
  Object.values(SUBSCRIPTION_STATUS),
)
export type SubscriptionStatus = ObjectValues<
  typeof SUBSCRIPTION_STATUS
>

export function get_subscription_status_label(
  type: number | SubscriptionStatus,
) {
  const subscription_status = v.parse(
    SubscriptionStatusSchema,
    type,
  )
  switch (subscription_status) {
    case SUBSCRIPTION_STATUS.ACTIVE: {
      return "Activa"
    }
    case SUBSCRIPTION_STATUS.GRACE: {
      return "Período de gracia"
    }
    case SUBSCRIPTION_STATUS.LOCKED: {
      return "Bloqueada"
    }
    default: {
      const _exhaustive: never = subscription_status
      return _exhaustive
    }
  }
}

export function get_subscription_statuses() {
  return Object.values(SUBSCRIPTION_STATUS)
}
