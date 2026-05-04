import type { EachMessagePayload, Producer } from "kafkajs"
import * as v from "valibot"
import { logger } from "../lib/logger"
import { send_email } from "../lib/send_email"
import { SendBookingConfirmationEvent } from "../event/send_booking_confirmation"
import { dlq_topic } from "../lib/topic"
import { deliver_email } from "../consumer/deliver_email"

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

  const visitant_html = event.visitant_text
    .split("\n\n")
    .map((paragraph: string) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("")
  const host_html = event.host_text
    .split("\n\n")
    .map((paragraph: string) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("")

  await deliver_email(payload, producer, async () => {
    const [visitant_error] = await send_email({
      to: event.visitant,
      subject: event.subject,
      html: visitant_html,
      ics: event.content,
    })
    if (visitant_error) {
      throw visitant_error.error
    }

    const [host_error] = await send_email({
      to: event.host,
      subject: event.subject,
      html: host_html,
      ics: event.content,
    })
    if (host_error) {
      throw host_error.error
    }
  })
}
