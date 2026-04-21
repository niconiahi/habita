import type { EachMessagePayload, Producer } from "kafkajs"
import * as v from "valibot"
import { logger } from "../lib/logger"
import { kv } from "../lib/kv"
import { delete_object } from "../lib/object_store"
import { DeleteObjectEvent } from "../event/delete_object"
import { dlq_topic } from "../lib/topic"
import {
  compose_headers,
  compose_idempotency_key,
  failure_reason,
  get_message_id,
  get_retry_count,
  IDEMPOTENCY_LOCK_TTL_SECONDS,
  incremented_retry,
  wait_for_retry,
  MAX_RETRIES,
  retry_after,
} from "../consumer/retry"

export async function handle_delete_object(
  payload: EachMessagePayload,
  producer: Producer,
) {
  const { message, topic } = payload
  const retry_count = get_retry_count(message.headers)
  const message_id = get_message_id(message.headers)

  await wait_for_retry(message.headers)

  if (message_id) {
    const lock_key = compose_idempotency_key(
      topic,
      message_id,
    )
    const is_locked = await kv.get(lock_key)
    if (is_locked) {
      logger.info(
        "skipping already processed delete_object event",
        { message_id },
      )
      return
    }
  }

  const raw = JSON.parse(message.value!.toString())

  const validation = v.safeParse(
    DeleteObjectEvent,
    raw,
  )
  if (!validation.success) {
    logger.error("malformed delete_object event", {
      issues: JSON.stringify(v.flatten(validation.issues)),
    })
    await producer.send({
      topic: dlq_topic(topic),
      messages: [
        {
          value: message.value,
          headers: compose_headers(message.headers, [
            failure_reason("validation"),
          ]),
        },
      ],
    })
    return
  }

  const [delete_error] = await delete_object(
    validation.output.key,
  )

  if (delete_error) {
    if (retry_count < MAX_RETRIES) {
      await producer.send({
        topic,
        messages: [
          {
            key: message.key,
            value: message.value,
            headers: compose_headers(message.headers, [
              incremented_retry(retry_count),
              retry_after(retry_count),
            ]),
          },
        ],
      })
      logger.warn("retrying delete_object event", {
        retry: retry_count + 1,
        key: validation.output.key,
        error: delete_error.error.message,
      })
    } else {
      await producer.send({
        topic: dlq_topic(topic),
        messages: [
          {
            value: message.value,
            headers: compose_headers(message.headers, [
              failure_reason(delete_error.error.message),
            ]),
          },
        ],
      })
      logger.error(
        "delete_object event sent to dead letter queue",
        { key: validation.output.key },
        delete_error.error,
      )
    }
    return
  }

  if (message_id) {
    const lock_key = compose_idempotency_key(
      topic,
      message_id,
    )
    await kv.set(
      lock_key,
      "1",
      IDEMPOTENCY_LOCK_TTL_SECONDS,
    )
  }

  logger.info("processed delete_object event", {
    key: validation.output.key,
  })
}
