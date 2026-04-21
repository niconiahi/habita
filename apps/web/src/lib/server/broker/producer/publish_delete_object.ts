import * as v from "valibot"
import { logger } from "../../../telemetry/logger"
import { MESSAGE_ID_HEADER } from "../topic"
import {
  DELETE_OBJECT_TOPIC,
  DeleteObjectEvent,
} from "../events/delete_object"
import { get_producer } from "./producer"

export async function publish_delete_object(
  key: string,
) {
  const validation = v.safeParse(DeleteObjectEvent, {
    key,
  })
  if (!validation.success) {
    throw new Error(
      "invalid payload for delete_object event",
    )
  }

  const producer = await get_producer()
  const message_id = key

  await producer.send({
    topic: DELETE_OBJECT_TOPIC,
    messages: [
      {
        key: message_id,
        value: JSON.stringify(validation.output),
        headers: { [MESSAGE_ID_HEADER]: message_id },
      },
    ],
  })

  logger.info("published delete_object event", { key })
}
