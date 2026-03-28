import * as v from "valibot"
import { logger } from "../../../telemetry/logger"
import { MESSAGE_ID_HEADER } from "../consumer/retry"
import {
  SEND_SIGNING_REQUEST_TOPIC,
  SendSigningRequestEvent,
} from "../events/send_signing_request"
import { get_producer } from "./producer"

export async function publish_send_signing_request(
  contract_id: number,
  payload: SendSigningRequestEvent,
) {
  const validation = v.safeParse(
    SendSigningRequestEvent,
    payload,
  )
  if (!validation.success) {
    throw new Error(
      "invalid payload for send_signing_request event",
    )
  }

  const producer = await get_producer()
  const message_id = String(contract_id)

  await producer.send({
    topic: SEND_SIGNING_REQUEST_TOPIC,
    messages: [
      {
        key: message_id,
        value: JSON.stringify(validation.output),
        headers: { [MESSAGE_ID_HEADER]: message_id },
      },
    ],
  })

  logger.info("published send_signing_request event", {
    contract_id,
    recipient_count: payload.recipients.length,
  })
}
