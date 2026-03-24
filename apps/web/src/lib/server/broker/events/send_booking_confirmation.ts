import * as v from "valibot"

export const SEND_BOOKING_CONFIRMATION_TOPIC =
  "send_booking_confirmation"

const RecipientSchema = v.object({
  email: v.string(),
  name: v.string(),
})

export const SendBookingConfirmationEvent = v.object({
  visitant: RecipientSchema,
  host: RecipientSchema,
  subject: v.string(),
  visitant_text: v.string(),
  host_text: v.string(),
  content: v.string(),
})

export type SendBookingConfirmationEvent = v.InferOutput<
  typeof SendBookingConfirmationEvent
>
