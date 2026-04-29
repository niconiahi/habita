// NOTE: this schema is duplicated in apps/{web,broker}/. Keep both in sync when changing.
import * as v from "valibot"

export const SEND_NO_SLOTS_ALERT_TOPIC =
  "send_no_slots_alert"

export const SendNoSlotsAlertEvent = v.object({
  manager_email: v.string(),
  manager_name: v.string(),
  visitant_name: v.string(),
  property_address: v.string(),
  visits_url: v.string(),
})

export type SendNoSlotsAlertEvent = v.InferOutput<
  typeof SendNoSlotsAlertEvent
>
