import { Kafka } from "kafkajs"
import { CALCULATE_ESCALATION_TOPIC } from "../events/calculate_escalation"
import { EXTEND_SUBSCRIPTION_TOPIC } from "../events/extend_subscription"
import { SEND_BOOKING_CONFIRMATION_TOPIC } from "../events/send_booking_confirmation"
import { SEND_LANDLORD_INVITE_TOPIC } from "../events/send_landlord_invite"
import { SEND_RENEWAL_REMINDER_TOPIC } from "../events/send_renewal_reminder"
import { SEND_SIGNING_REQUEST_TOPIC } from "../events/send_signing_request"
import { dlq_topic } from "../topic"

const kafka = new Kafka({
  clientId: "habita-admin",
  brokers: (
    process.env.BROKER_BROKERS ?? "redpanda:9092"
  ).split(","),
})

const topics = [
  EXTEND_SUBSCRIPTION_TOPIC,
  CALCULATE_ESCALATION_TOPIC,
  SEND_RENEWAL_REMINDER_TOPIC,
  SEND_BOOKING_CONFIRMATION_TOPIC,
  SEND_SIGNING_REQUEST_TOPIC,
  SEND_LANDLORD_INVITE_TOPIC,
]

async function create_topics() {
  const admin = kafka.admin()
  await admin.connect()

  const topic_configurations = topics.flatMap((topic) => [
    { topic, numPartitions: 1, replicationFactor: 1 },
    {
      topic: dlq_topic(topic),
      numPartitions: 1,
      replicationFactor: 1,
    },
  ])

  const created = await admin.createTopics({
    topics: topic_configurations,
  })

  if (created) {
    console.log(
      "created topics:",
      topic_configurations.map((t) => t.topic).join(", "),
    )
  } else {
    console.log("topics already exist, skipping")
  }

  await admin.disconnect()
}

create_topics()
