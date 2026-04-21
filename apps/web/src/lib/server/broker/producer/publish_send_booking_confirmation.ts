import * as v from "valibot"
import { logger } from "../../../telemetry/logger"
import { MESSAGE_ID_HEADER } from "../topic"
import {
  SEND_BOOKING_CONFIRMATION_TOPIC,
  SendBookingConfirmationEvent,
} from "../events/send_booking_confirmation"
import { get_producer } from "./producer"

export async function publish_send_booking_confirmation(
  slot_id: number,
  payload: SendBookingConfirmationEvent,
) {
  const validation = v.safeParse(
    SendBookingConfirmationEvent,
    payload,
  )
  if (!validation.success) {
    throw new Error(
      "invalid payload for send_booking_confirmation event",
    )
  }

  const producer = await get_producer()
  const message_id = String(slot_id)

  await producer.send({
    topic: SEND_BOOKING_CONFIRMATION_TOPIC,
    messages: [
      {
        key: message_id,
        value: JSON.stringify(validation.output),
        headers: { [MESSAGE_ID_HEADER]: message_id },
      },
    ],
  })

  logger.info("published send_booking_confirmation event", {
    slot_id,
    visitant_email: payload.visitant.email,
    host_email: payload.host.email,
  })
}
