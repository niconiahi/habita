import * as v from "valibot"
import { get_producer } from "./producer"
import { logger } from "../../../telemetry/logger"
import { MESSAGE_ID_HEADER } from "../consumer/retry"
import {
  SEND_LANDLORD_INVITE_TOPIC,
  SendLandlordInviteEvent,
} from "../events/send_landlord_invite"

export async function publish_send_landlord_invite(
  property_id: number,
  invitation_token_id: number,
  payload: SendLandlordInviteEvent,
) {
  const validation = v.safeParse(
    SendLandlordInviteEvent,
    payload,
  )
  if (!validation.success) {
    throw new Error(
      "invalid payload for send_landlord_invite event",
    )
  }

  const producer = await get_producer()
  const message_id = `${property_id}:${invitation_token_id}`

  await producer.send({
    topic: SEND_LANDLORD_INVITE_TOPIC,
    messages: [
      {
        key: message_id,
        value: JSON.stringify(validation.output),
        headers: { [MESSAGE_ID_HEADER]: message_id },
      },
    ],
  })

  logger.info("published send_landlord_invite event", {
    property_id,
    invitation_token_id,
  })
}
