import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const NOTIFICATION_TYPE = {
  PROPERTY_VISIT: 0,
} as const
export const NotificationTypeSchema = v.picklist(
  Object.values(NOTIFICATION_TYPE),
)
export type NotificationType = ObjectValues<typeof NOTIFICATION_TYPE>

export function get_notification_type_label(
  type: number | NotificationType,
) {
  const notification_type = v.parse(NotificationTypeSchema, type)
  switch (notification_type) {
    case NOTIFICATION_TYPE.PROPERTY_VISIT: {
      return "Visita a propiedad"
    }
    default: {
      const _exhaustive: never = notification_type
      return _exhaustive
    }
  }
}

export function get_notification_types() {
  return Object.values(NOTIFICATION_TYPE)
}
