import * as v from "valibot"
import { logger } from "../../../telemetry/logger"
import { MESSAGE_ID_HEADER } from "../topic"
import {
  EXTEND_SUBSCRIPTION_TOPIC,
  ExtendSubscriptionEvent,
} from "../events/extend_subscription"
import { get_producer } from "./producer"

export async function publish_extend_subscription(
  subscription_payment_id: number,
) {
  const validation = v.safeParse(ExtendSubscriptionEvent, {
    subscription_payment_id,
  })
  if (!validation.success) {
    throw new Error(
      "invalid payload for extend_subscription event",
    )
  }

  const producer = await get_producer()
  const message_id = String(subscription_payment_id)

  await producer.send({
    topic: EXTEND_SUBSCRIPTION_TOPIC,
    messages: [
      {
        key: message_id,
        value: JSON.stringify(validation.output),
        headers: { [MESSAGE_ID_HEADER]: message_id },
      },
    ],
  })

  logger.info("published extend_subscription event", {
    subscription_payment_id,
  })
}
