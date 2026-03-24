import { Kafka } from "kafkajs"
import { init_telemetry } from "../../telemetry/sdk"
import { logger } from "../../../telemetry/logger"
import { EXTEND_SUBSCRIPTION_TOPIC } from "../events/extend_subscription"
import { CALCULATE_ESCALATION_TOPIC } from "../events/calculate_escalation"
import { SEND_RENEWAL_REMINDER_TOPIC } from "../events/send_renewal_reminder"
import { SEND_BOOKING_CONFIRMATION_TOPIC } from "../events/send_booking_confirmation"
import { SEND_SIGNING_REQUEST_TOPIC } from "../events/send_signing_request"
import { SEND_LANDLORD_INVITE_TOPIC } from "../events/send_landlord_invite"
import { handle_extend_subscription } from "./handle_extend_subscription"
import { handle_calculate_escalation } from "./handle_calculate_escalation"
import { handle_send_renewal_reminder } from "./handle_send_renewal_reminder"
import { handle_send_booking_confirmation } from "./handle_send_booking_confirmation"
import { handle_send_signing_request } from "./handle_send_signing_request"
import { handle_send_landlord_invite } from "./handle_send_landlord_invite"
import { dlq_topic } from "../topic"
import { with_failure_reason } from "./retry"

init_telemetry()

const kafka = new Kafka({
  clientId: "habita-consumer",
  brokers: (
    process.env.BROKER_BROKERS ?? "redpanda:9092"
  ).split(","),
})

const consumer = kafka.consumer({
  groupId: "habita-consumers",
})

const producer = kafka.producer()

async function main() {
  await consumer.connect()
  await producer.connect()

  await consumer.subscribe({
    topics: [
      EXTEND_SUBSCRIPTION_TOPIC,
      CALCULATE_ESCALATION_TOPIC,
      SEND_RENEWAL_REMINDER_TOPIC,
      SEND_BOOKING_CONFIRMATION_TOPIC,
      SEND_SIGNING_REQUEST_TOPIC,
      SEND_LANDLORD_INVITE_TOPIC,
    ],
  })

  await consumer.run({
    eachMessage: async (payload) => {
      const { topic, partition, message } = payload
      const offset = message.offset

      logger.info("received message", {
        topic,
        partition,
        offset,
      })

      try {
        switch (topic) {
          case EXTEND_SUBSCRIPTION_TOPIC: {
            await handle_extend_subscription(
              payload,
              producer,
            )
            break
          }
          case CALCULATE_ESCALATION_TOPIC: {
            await handle_calculate_escalation(
              payload,
              producer,
            )
            break
          }
          case SEND_RENEWAL_REMINDER_TOPIC: {
            await handle_send_renewal_reminder(
              payload,
              producer,
            )
            break
          }
          case SEND_BOOKING_CONFIRMATION_TOPIC: {
            await handle_send_booking_confirmation(
              payload,
              producer,
            )
            break
          }
          case SEND_SIGNING_REQUEST_TOPIC: {
            await handle_send_signing_request(
              payload,
              producer,
            )
            break
          }
          case SEND_LANDLORD_INVITE_TOPIC: {
            await handle_send_landlord_invite(
              payload,
              producer,
            )
            break
          }
          default: {
            logger.warn(
              "received message for unknown topic",
              {
                topic,
              },
            )
          }
        }
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error(String(error))

        logger.error(
          "unhandled error processing message",
          { topic, partition, offset },
          err,
        )

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
      }
    },
  })

  logger.info("consumer started", {
    topics: [
      EXTEND_SUBSCRIPTION_TOPIC,
      CALCULATE_ESCALATION_TOPIC,
      SEND_RENEWAL_REMINDER_TOPIC,
      SEND_BOOKING_CONFIRMATION_TOPIC,
      SEND_SIGNING_REQUEST_TOPIC,
      SEND_LANDLORD_INVITE_TOPIC,
    ],
  })
}

function shutdown() {
  logger.info("shutting down consumer")
  consumer
    .disconnect()
    .then(() => producer.disconnect())
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)

main().catch((error) => {
  logger.error(
    "fatal error starting consumer",
    {},
    error instanceof Error
      ? error
      : new Error(String(error)),
  )
  process.exit(1)
})
