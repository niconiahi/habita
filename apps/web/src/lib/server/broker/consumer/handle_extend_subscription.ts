import type { EachMessagePayload, Producer } from "kafkajs"
import * as v from "valibot"
import { logger } from "../../../telemetry/logger"
import { extend_subscription_by_payment_id } from "../../cron/extend_subscription"
import { kv } from "../../kv"
import { ExtendSubscriptionEvent } from "../events/extend_subscription"
import { dlq_topic } from "../topic"
import {
  compose_idempotency_key,
  get_message_id,
  get_retry_count,
  IDEMPOTENCY_LOCK_TTL_SECONDS,
  MAX_RETRIES,
  with_failure_reason,
  with_incremented_retry,
} from "./retry"

export async function handle_extend_subscription(
  payload: EachMessagePayload,
  producer: Producer,
) {
  const { message, topic } = payload
  const retry_count = get_retry_count(message.headers)
  const message_id = get_message_id(message.headers)

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
          headers: with_failure_reason(
            message.headers,
            "validation",
          ),
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
            headers: with_incremented_retry(
              message.headers,
              retry_count,
            ),
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
            headers: with_failure_reason(
              message.headers,
              err.message,
            ),
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
