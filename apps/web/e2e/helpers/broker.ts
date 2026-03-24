import { Kafka, type KafkaMessage } from "kafkajs"
import { dlq_topic } from "../../src/lib/server/broker/topic"

const kafka = new Kafka({
  clientId: "test",
  brokers: (
    process.env.BROKER_BROKERS ?? "redpanda:9092"
  ).split(","),
})

export async function fetch_latest_message(
  topic: string,
): Promise<KafkaMessage | null> {
  const admin = kafka.admin()
  await admin.connect()

  const offsets = await admin.fetchTopicOffsets(topic)
  const latest_offset = Number(offsets[0]?.offset ?? "0")

  await admin.disconnect()

  if (latest_offset === 0) return null

  const consumer = kafka.consumer({
    groupId: `test-${topic}-${Date.now()}`,
  })
  await consumer.connect()
  await consumer.subscribe({ topic, fromBeginning: false })

  let resolved = false
  const message = await new Promise<KafkaMessage | null>(
    (resolve) => {
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          resolve(null)
        }
      }, 5000)

      consumer.run({
        eachMessage: async ({ message }) => {
          if (!resolved) {
            resolved = true
            clearTimeout(timeout)
            resolve(message)
          }
        },
      })

      consumer.seek({
        topic,
        partition: 0,
        offset: String(latest_offset - 1),
      })
    },
  )

  await consumer.disconnect()
  return message
}

export function parse_message_value(
  message: KafkaMessage,
): unknown {
  return JSON.parse(message.value!.toString())
}

export function get_message_header(
  message: KafkaMessage,
  header: string,
): string | undefined {
  const value = message.headers?.[header]
  if (!value) return undefined
  return value.toString()
}

export async function assert_topic_has_offset(
  topic: string,
  minimum_offset: number,
): Promise<void> {
  const admin = kafka.admin()
  await admin.connect()

  const offsets = await admin.fetchTopicOffsets(topic)
  const latest_offset = Number(offsets[0]?.offset ?? "0")

  await admin.disconnect()

  if (latest_offset < minimum_offset) {
    throw new Error(
      `expected topic "${topic}" to have at least offset ${minimum_offset}, got ${latest_offset}`,
    )
  }
}

export async function assert_dead_letter_queue_is_empty(
  topic: string,
): Promise<void> {
  const dead_letter = dlq_topic(topic)
  const admin = kafka.admin()
  await admin.connect()

  const offsets =
    await admin.fetchTopicOffsets(dead_letter)
  const latest_offset = Number(offsets[0]?.offset ?? "0")

  await admin.disconnect()

  if (latest_offset > 0) {
    throw new Error(
      `expected DLQ "${dead_letter}" to be empty, got ${latest_offset} messages`,
    )
  }
}
