import * as v from "valibot"

export const SEND_LANDLORD_INVITE_TOPIC =
  "send_landlord_invite"

export const SendLandlordInviteEvent = v.object({
  email: v.string(),
  subject: v.string(),
  html: v.string(),
})

export type SendLandlordInviteEvent = v.InferOutput<
  typeof SendLandlordInviteEvent
>
