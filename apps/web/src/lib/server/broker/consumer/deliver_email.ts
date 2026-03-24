import type { EachMessagePayload, Producer } from "kafkajs"
import { logger } from "../../../telemetry/logger"
import { kv } from "../../kv"
import { dlq_topic } from "../topic"
import {
  MAX_RETRIES,
  IDEMPOTENCY_LOCK_TTL_SECONDS,
  get_retry_count,
  get_message_id,
  compose_idempotency_key,
  with_incremented_retry,
  with_failure_reason,
} from "./retry"

export async function deliver_email(
  payload: EachMessagePayload,
  producer: Producer,
  send: () => Promise<void>,
) {
  const { message, topic } = payload
  const retry_count = get_retry_count(message.headers)
  const message_id = get_message_id(message.headers)

  if (message_id) {
    const lock_key = compose_idempotency_key(topic, message_id)
    const is_locked = await kv.get(lock_key)
    if (is_locked) {
      logger.info(`skipping already processed ${topic} event`, {
        message_id,
      })
      return
    }
  }

  try {
    await send()

    if (message_id) {
      const lock_key = compose_idempotency_key(topic, message_id)
      await kv.set(
        lock_key,
        "1",
        IDEMPOTENCY_LOCK_TTL_SECONDS,
      )
    }

    logger.info(`processed ${topic} event`)
  } catch (error) {
    const err =
      error instanceof Error
        ? error
        : new Error(String(error))

    if (retry_count < MAX_RETRIES) {
      await producer.send({
        topic,
        messages: [
          {
            key: message.key,
            value: message.value,
            headers: with_incremented_retry(
              message.headers,
              retry_count,
            ),
          },
        ],
      })
      logger.warn(`retrying ${topic} event`, {
        retry: retry_count + 1,
        error: err.message,
      })
    } else {
      await producer.send({
        topic: dlq_topic(topic),
        messages: [
          {
            value: message.value,
            headers: with_failure_reason(
              message.headers,
              err.message,
            ),
          },
        ],
      })
      logger.error(
        `${topic} event sent to dead letter queue`,
        {},
        err,
      )
    }
  }
}
