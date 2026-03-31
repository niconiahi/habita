import * as v from "valibot"
import { NOTIFICATION_TYPE } from "$lib/notification_type"

export const PropertyVisitNotificationSchema = v.object({
  id: v.number(),
  type: v.literal(NOTIFICATION_TYPE.PROPERTY_VISIT),
  href: v.string(),
  property_id: v.number(),
  created_at: v.string(),
  location: v.object({
    road: v.string(),
    house_number: v.number(),
  }),
})

export type PropertyVisitNotification = v.InferOutput<
  typeof PropertyVisitNotificationSchema
>

export const NotificationSchema = v.variant("type", [
  PropertyVisitNotificationSchema,
])

export const NotificationsSchema = v.array(
  NotificationSchema,
)

export type Notification = v.InferOutput<
  typeof NotificationSchema
>
