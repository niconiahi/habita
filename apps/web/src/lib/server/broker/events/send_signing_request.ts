import * as v from "valibot"

export const SEND_SIGNING_REQUEST_TOPIC =
  "send_signing_request"

const RecipientSchema = v.object({
  email: v.string(),
  name: v.string(),
})

export const SendSigningRequestEvent = v.object({
  recipients: v.array(RecipientSchema),
  subject: v.string(),
  html: v.string(),
})

export type SendSigningRequestEvent = v.InferOutput<
  typeof SendSigningRequestEvent
>
