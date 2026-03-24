import * as v from "valibot"

export const SEND_RENEWAL_REMINDER_TOPIC =
  "send_renewal_reminder"

export const SendRenewalReminderEvent = v.object({})

export type SendRenewalReminderEvent = v.InferOutput<
  typeof SendRenewalReminderEvent
>
