import { logger } from "../../../telemetry/logger"
import { MESSAGE_ID_HEADER } from "../topic"
import { CALCULATE_ESCALATION_TOPIC } from "../events/calculate_escalation"
import { get_producer } from "./producer"

export async function publish_calculate_escalation() {
  const producer = await get_producer()
  const message_id = new Date().toISOString().split("T")[0]

  await producer.send({
    topic: CALCULATE_ESCALATION_TOPIC,
    messages: [
      {
        value: JSON.stringify({}),
        headers: { [MESSAGE_ID_HEADER]: message_id },
      },
    ],
  })

  logger.info("published calculate_escalation event")
}
