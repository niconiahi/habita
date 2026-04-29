import * as v from "valibot"
import { logger } from "../../../telemetry/logger"
import { MESSAGE_ID_HEADER } from "../topic"
import {
  SEND_NO_SLOTS_ALERT_TOPIC,
  SendNoSlotsAlertEvent,
} from "../events/send_no_slots_alert"
import { get_producer } from "./producer"

export async function publish_send_no_slots_alert(
  property_id: number,
  user_id: number,
  payload: SendNoSlotsAlertEvent,
) {
  const validation = v.safeParse(
    SendNoSlotsAlertEvent,
    payload,
  )
  if (!validation.success) {
    throw new Error(
      "invalid payload for send_no_slots_alert event",
    )
  }

  const producer = await get_producer()
  const message_id = `${property_id}:${user_id}`

  await producer.send({
    topic: SEND_NO_SLOTS_ALERT_TOPIC,
    messages: [
      {
        key: message_id,
        value: JSON.stringify(validation.output),
        headers: { [MESSAGE_ID_HEADER]: message_id },
      },
    ],
  })

  logger.info("published send_no_slots_alert event", {
    property_id,
    user_id,
    manager_email: payload.manager_email,
  })
}
