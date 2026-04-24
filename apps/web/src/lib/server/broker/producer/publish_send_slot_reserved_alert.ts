import * as v from "valibot"
import { logger } from "../../../telemetry/logger"
import { MESSAGE_ID_HEADER } from "../topic"
import {
  SEND_SLOT_RESERVED_ALERT_TOPIC,
  SendSlotReservedAlertEvent,
} from "../events/send_slot_reserved_alert"
import { get_producer } from "./producer"

export async function publish_send_slot_reserved_alert(
  slot_id: number,
  payload: SendSlotReservedAlertEvent,
) {
  const validation = v.safeParse(
    SendSlotReservedAlertEvent,
    payload,
  )
  if (!validation.success) {
    throw new Error(
      "invalid payload for send_slot_reserved_alert event",
    )
  }

  const producer = await get_producer()
  const message_id = String(slot_id)

  await producer.send({
    topic: SEND_SLOT_RESERVED_ALERT_TOPIC,
    messages: [
      {
        key: message_id,
        value: JSON.stringify(validation.output),
        headers: { [MESSAGE_ID_HEADER]: message_id },
      },
    ],
  })

  logger.info("published send_slot_reserved_alert event", {
    slot_id,
    host_email: payload.host_email,
  })
}
