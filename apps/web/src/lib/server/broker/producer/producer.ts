import { Kafka, type Producer } from "kafkajs"

function make_kafka() {
  return new Kafka({
    clientId: "habita",
    brokers: (
      process.env.BROKER_BROKERS ?? "redpanda:9092"
    ).split(","),
  })
}

function get_kafka(): Kafka {
  return (globalThis.__kafka ??= make_kafka()) as Kafka
}

let producer_instance: Producer | null = null

export async function get_producer() {
  if (!producer_instance) {
    producer_instance = get_kafka().producer()
    await producer_instance.connect()
  }
  return producer_instance
}
