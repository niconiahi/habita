import * as v from "valibot"
import { logger } from "../../../telemetry/logger"
import { MESSAGE_ID_HEADER } from "../topic"
import {
  SEND_SLOT_REJECTED_ALERT_TOPIC,
  SendSlotRejectedAlertEvent,
} from "../events/send_slot_rejected_alert"
import { get_producer } from "./producer"

export async function publish_send_slot_rejected_alert(
  slot_id: number,
  payload: SendSlotRejectedAlertEvent,
) {
  const validation = v.safeParse(
    SendSlotRejectedAlertEvent,
    payload,
  )
  if (!validation.success) {
    throw new Error(
      "invalid payload for send_slot_rejected_alert event",
    )
  }

  const producer = await get_producer()
  const message_id = String(slot_id)

  await producer.send({
    topic: SEND_SLOT_REJECTED_ALERT_TOPIC,
    messages: [
      {
        key: message_id,
        value: JSON.stringify(validation.output),
        headers: { [MESSAGE_ID_HEADER]: message_id },
      },
    ],
  })

  logger.info("published send_slot_rejected_alert event", {
    slot_id,
    visitant_email: payload.visitant_email,
  })
}
