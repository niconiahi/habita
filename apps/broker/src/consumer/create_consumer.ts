import { Kafka, type EachMessagePayload, type Producer } from "kafkajs"
import { logger } from "../lib/logger"
import { init_telemetry } from "./telemetry"
import { dlq_topic } from "../lib/topic"
import { compose_headers, failure_reason } from "./retry"

type TopicHandler = (
  payload: EachMessagePayload,
  producer: Producer,
) => Promise<void>

interface ConsumerConfig {
  client_id: string
  group_id: string
  handlers: Record<string, TopicHandler>
}

export function create_consumer(config: ConsumerConfig) {
  init_telemetry()

  const kafka = new Kafka({
    clientId: config.client_id,
    brokers: (
      process.env.BROKER_BROKERS ?? "redpanda:9092"
    ).split(","),
  })

  const consumer = kafka.consumer({
    groupId: config.group_id,
  })

  const producer = kafka.producer()

  const topics = Object.keys(config.handlers)

  async function main() {
    await consumer.connect()
    await producer.connect()

    await consumer.subscribe({ topics })

    await consumer.run({
      eachMessage: async (payload) => {
        const { topic, partition, message } = payload
        const offset = message.offset

        logger.info("received message", {
          topic,
          partition,
          offset,
        })

        const handler = config.handlers[topic]
        if (!handler) {
          logger.warn(
            "received message for unknown topic",
            { topic },
          )
          return
        }

        try {
          await handler(payload, producer)
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
                headers: compose_headers(
                  message.headers,
                  [failure_reason(err.message)],
                ),
              },
            ],
          })
        }
      },
    })

    logger.info("consumer started", { topics })
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
}
