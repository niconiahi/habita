import * as v from "valibot"
import { logger } from "../../../telemetry/logger"
import { MESSAGE_ID_HEADER } from "../topic"
import {
  SEND_TEAM_INVITE_TOPIC,
  SendTeamInviteEvent,
} from "../events/send_team_invite"
import { get_producer } from "./producer"

export async function publish_send_team_invite(
  invitation_id: string,
  payload: SendTeamInviteEvent,
) {
  const validation = v.safeParse(
    SendTeamInviteEvent,
    payload,
  )
  if (!validation.success) {
    throw new Error(
      "invalid payload for send_team_invite event",
    )
  }

  const producer = await get_producer()
  const message_id = invitation_id

  await producer.send({
    topic: SEND_TEAM_INVITE_TOPIC,
    messages: [
      {
        key: message_id,
        value: JSON.stringify(validation.output),
        headers: { [MESSAGE_ID_HEADER]: message_id },
      },
    ],
  })

  logger.info("published send_team_invite event", {
    invitation_id,
  })
}
