import type { EachMessagePayload, Producer } from "kafkajs"
import * as v from "valibot"
import { logger } from "../lib/logger"
import { extend_subscription_by_payment_id } from "../service/extend_subscription"
import { kv } from "../lib/kv"
import { ExtendSubscriptionEvent } from "../event/extend_subscription"
import { dlq_topic } from "../lib/topic"
import {
  compose_headers,
  compose_idempotency_key,
  failure_reason,
  get_message_id,
  get_retry_count,
  IDEMPOTENCY_LOCK_TTL_SECONDS,
  incremented_retry,
  MAX_RETRIES,
  retry_after,
  wait_for_retry,
} from "../consumer/retry"

export async function handle_extend_subscription(
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
        "skipping already processed extend_subscription event",
        { message_id },
      )
      return
    }
  }

  const raw = JSON.parse(message.value!.toString())

  const validation = v.safeParse(
    ExtendSubscriptionEvent,
    raw,
  )
  if (!validation.success) {
    logger.error("malformed extend_subscription event", {
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

  try {
    await extend_subscription_by_payment_id(
      validation.output.subscription_payment_id,
    )

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

    logger.info("processed extend_subscription event", {
      subscription_payment_id:
        validation.output.subscription_payment_id,
    })
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
            headers: compose_headers(message.headers, [
              incremented_retry(retry_count),
              retry_after(retry_count),
            ]),
          },
        ],
      })
      logger.warn("retrying extend_subscription event", {
        retry: retry_count + 1,
        subscription_payment_id:
          validation.output.subscription_payment_id,
        error: err.message,
      })
    } else {
      await producer.send({
        topic: dlq_topic(topic),
        messages: [
          {
            value: message.value,
            headers: compose_headers(message.headers, [
              failure_reason(err.message),
            ]),
          },
        ],
      })
      logger.error(
        "extend_subscription event sent to dead letter queue",
        {
          subscription_payment_id:
            validation.output.subscription_payment_id,
        },
        err,
      )
    }
  }
}
