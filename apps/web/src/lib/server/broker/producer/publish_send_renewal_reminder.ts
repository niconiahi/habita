import { logger } from "../../../telemetry/logger"
import { MESSAGE_ID_HEADER } from "../consumer/retry"
import { SEND_RENEWAL_REMINDER_TOPIC } from "../events/send_renewal_reminder"
import { get_producer } from "./producer"

export async function publish_send_renewal_reminder() {
  const producer = await get_producer()
  const message_id = new Date().toISOString().split("T")[0]

  await producer.send({
    topic: SEND_RENEWAL_REMINDER_TOPIC,
    messages: [
      {
        value: JSON.stringify({}),
        headers: { [MESSAGE_ID_HEADER]: message_id },
      },
    ],
  })

  logger.info("published send_renewal_reminder event")
}
