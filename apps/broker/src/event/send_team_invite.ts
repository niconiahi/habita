// NOTE: this schema is duplicated in apps/{web,broker}/. Keep both in sync when changing.
import * as v from "valibot"

export const SEND_TEAM_INVITE_TOPIC = "send_team_invite"

export const SendTeamInviteEvent = v.object({
  email: v.string(),
  subject: v.string(),
  html: v.string(),
})

export type SendTeamInviteEvent = v.InferOutput<
  typeof SendTeamInviteEvent
>
