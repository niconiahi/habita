import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const SUBSCRIPTION_TYPE = {
  FREELANCE: 0,
  REALTOR: 1,
} as const
export const SubscriptionTypeSchema = v.picklist(
  Object.values(SUBSCRIPTION_TYPE),
)
export type SubscriptionType = ObjectValues<
  typeof SUBSCRIPTION_TYPE
>

export function get_subscription_type_label(
  type: number | SubscriptionType,
) {
  const subscription_type = v.parse(
    SubscriptionTypeSchema,
    type,
  )
  switch (subscription_type) {
    case SUBSCRIPTION_TYPE.FREELANCE: {
      return "Freelance"
    }
    case SUBSCRIPTION_TYPE.REALTOR: {
      return "Inmobiliaria"
    }
    default: {
      const _exhaustive: never = subscription_type
      return _exhaustive
    }
  }
}

export function get_subscription_types() {
  return Object.values(SUBSCRIPTION_TYPE)
}
