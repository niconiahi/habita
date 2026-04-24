// NOTE: this schema is duplicated in apps/{web,broker}/. Keep both in sync when changing.
import * as v from "valibot"

export const SEND_SLOT_RESERVED_ALERT_TOPIC =
  "send_slot_reserved_alert"

export const SendSlotReservedAlertEvent = v.object({
  host_email: v.string(),
  host_name: v.string(),
  visitant_name: v.string(),
  property_address: v.string(),
  start_date: v.string(),
  end_date: v.string(),
})

export type SendSlotReservedAlertEvent = v.InferOutput<
  typeof SendSlotReservedAlertEvent
>
