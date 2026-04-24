// NOTE: this schema is duplicated in apps/{web,broker}/. Keep both in sync when changing.
import * as v from "valibot"

export const SEND_SLOT_REJECTED_ALERT_TOPIC =
  "send_slot_rejected_alert"

export const SendSlotRejectedAlertEvent = v.object({
  visitant_email: v.string(),
  visitant_name: v.string(),
  property_address: v.string(),
  start_date: v.string(),
  end_date: v.string(),
})

export type SendSlotRejectedAlertEvent = v.InferOutput<
  typeof SendSlotRejectedAlertEvent
>
