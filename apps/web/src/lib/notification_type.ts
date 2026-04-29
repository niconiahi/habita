import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const NOTIFICATION_TYPE = {
  PROPERTY_VISIT: 0,
  NO_AVAILABLE_SLOTS: 1,
} as const
export const NotificationTypeSchema = v.picklist(
  Object.values(NOTIFICATION_TYPE),
)
export type NotificationType = ObjectValues<
  typeof NOTIFICATION_TYPE
>

export function get_notification_type_label(
  type: number | NotificationType,
) {
  const notification_type = v.parse(
    NotificationTypeSchema,
    type,
  )
  switch (notification_type) {
    case NOTIFICATION_TYPE.PROPERTY_VISIT: {
      return "Visita a propiedad"
    }
    case NOTIFICATION_TYPE.NO_AVAILABLE_SLOTS: {
      return "Sin turnos disponibles"
    }
    default: {
      const _exhaustive: never = notification_type
      return _exhaustive
    }
  }
}

export function compose_property_visit_href(
  property_id: number,
) {
  return `/admin/properties/${property_id}/edit/visits`
}

export function compose_no_available_slots_href(
  property_id: number,
) {
  return `/admin/properties/${property_id}/edit/visits`
}

export function get_notification_types() {
  return Object.values(NOTIFICATION_TYPE)
}
