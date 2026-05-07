import { Kafka } from "kafkajs"
import { CALCULATE_ESCALATION_TOPIC } from "../event/calculate_escalation"
import { EXTEND_SUBSCRIPTION_TOPIC } from "../event/extend_subscription"
import { SEND_BOOKING_CONFIRMATION_TOPIC } from "../event/send_booking_confirmation"
import { SEND_LANDLORD_INVITE_TOPIC } from "../event/send_landlord_invite"
import { SEND_TEAM_INVITE_TOPIC } from "../event/send_team_invite"
import { SEND_RENEWAL_REMINDER_TOPIC } from "../event/send_renewal_reminder"
import { SEND_SIGNING_REQUEST_TOPIC } from "../event/send_signing_request"
import { SEND_NO_SLOTS_ALERT_TOPIC } from "../event/send_no_slots_alert"
import { SEND_SLOT_REJECTED_ALERT_TOPIC } from "../event/send_slot_rejected_alert"
import { SEND_SLOT_RESERVED_ALERT_TOPIC } from "../event/send_slot_reserved_alert"
import { dlq_topic } from "../lib/topic"

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
  SEND_TEAM_INVITE_TOPIC,
  SEND_SLOT_RESERVED_ALERT_TOPIC,
  SEND_SLOT_REJECTED_ALERT_TOPIC,
  SEND_NO_SLOTS_ALERT_TOPIC,
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
