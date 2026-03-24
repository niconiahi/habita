import * as v from "valibot"
import type { EachMessagePayload, Producer } from "kafkajs"
import { logger } from "../../../telemetry/logger"
import { send_email } from "../../send_email"
import { SendBookingConfirmationEvent } from "../events/send_booking_confirmation"
import { dlq_topic } from "../topic"
import { deliver_email } from "./deliver_email"

export async function handle_send_booking_confirmation(
  payload: EachMessagePayload,
  producer: Producer,
) {
  const { message, topic } = payload
  const raw = JSON.parse(message.value!.toString())

  const validation = v.safeParse(
    SendBookingConfirmationEvent,
    raw,
  )
  if (!validation.success) {
    logger.error(
      "malformed send_booking_confirmation event",
      {
        issues: JSON.stringify(
          v.flatten(validation.issues),
        ),
      },
    )
    await producer.send({
      topic: dlq_topic(topic),
      messages: [
        {
          value: message.value,
          headers: {
            ...message.headers,
            "failure-reason": "validation",
          },
        },
      ],
    })
    return
  }

  const event = validation.output

  await deliver_email(payload, producer, async () => {
    const [visitant_error] = await send_email({
      to: event.visitant,
      subject: event.subject,
      text: event.visitant_text,
      content: event.content,
    })
    if (visitant_error) {
      throw visitant_error.error
    }

    const [host_error] = await send_email({
      to: event.host,
      subject: event.subject,
      text: event.host_text,
      content: event.content,
    })
    if (host_error) {
      throw host_error.error
    }
  })
}
