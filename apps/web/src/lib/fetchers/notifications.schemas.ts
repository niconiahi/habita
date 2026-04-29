import * as v from "valibot"
import { NOTIFICATION_TYPE } from "$lib/notification_type"

export const PropertyVisitNotificationSchema = v.object({
  id: v.number(),
  type: v.literal(NOTIFICATION_TYPE.PROPERTY_VISIT),
  href: v.string(),
  property_id: v.number(),
  created_at: v.string(),
  read_at: v.nullable(v.string()),
  location: v.object({
    road: v.string(),
    house_number: v.number(),
  }),
})

export type PropertyVisitNotification = v.InferOutput<
  typeof PropertyVisitNotificationSchema
>

export const NoAvailableSlotsNotificationSchema = v.object({
  id: v.number(),
  type: v.literal(NOTIFICATION_TYPE.NO_AVAILABLE_SLOTS),
  href: v.string(),
  property_id: v.number(),
  created_at: v.string(),
  read_at: v.nullable(v.string()),
  location: v.object({
    road: v.string(),
    house_number: v.number(),
  }),
})

export type NoAvailableSlotsNotification = v.InferOutput<
  typeof NoAvailableSlotsNotificationSchema
>

export const NotificationSchema = v.variant("type", [
  PropertyVisitNotificationSchema,
  NoAvailableSlotsNotificationSchema,
])

export const NotificationsSchema = v.array(
  NotificationSchema,
)

export type Notification = v.InferOutput<
  typeof NotificationSchema
>
