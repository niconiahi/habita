import type { EachMessagePayload, Producer } from "kafkajs"
import { logger } from "../../../telemetry/logger"
import { calculate_all_due_escalations } from "../../calculate_all_due_escalations"
import { kv } from "../../kv"
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

export async function handle_calculate_escalation(
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
        "skipping already processed calculate_escalation event",
        { message_id },
      )
      return
    }
  }

  try {
    const result = await calculate_all_due_escalations()

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

    logger.info("processed calculate_escalation event", {
      contracts_processed: result.processed,
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
      logger.warn("retrying calculate_escalation event", {
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
        "calculate_escalation event sent to dead letter queue",
        {},
        err,
      )
    }
  }
}
