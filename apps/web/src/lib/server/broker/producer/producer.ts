import { Kafka, type Producer } from "kafkajs"
import { lazy } from "$lib/server/lazy"

const kafka = lazy(
  () =>
    new Kafka({
      clientId: "habita",
      brokers: (
        process.env.BROKER_BROKERS ?? "redpanda:9092"
      ).split(","),
    }),
)

let producer_instance: Producer | null = null

export async function get_producer() {
  if (!producer_instance) {
    producer_instance = kafka.producer()
    await producer_instance.connect()
  }
  return producer_instance
}
