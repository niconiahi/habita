import type { EachMessagePayload, Producer } from "kafkajs"
import * as v from "valibot"
import { logger } from "../lib/logger"
import { send_email } from "../lib/send_email"
import { SendLandlordInviteEvent } from "../event/send_landlord_invite"
import { dlq_topic } from "../lib/topic"
import { deliver_email } from "../consumer/deliver_email"

export async function handle_send_landlord_invite(
  payload: EachMessagePayload,
  producer: Producer,
) {
  const { message, topic } = payload
  const raw = JSON.parse(message.value!.toString())

  const validation = v.safeParse(
    SendLandlordInviteEvent,
    raw,
  )
  if (!validation.success) {
    logger.error("malformed send_landlord_invite event", {
      issues: JSON.stringify(v.flatten(validation.issues)),
    })
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
    const [email_error] = await send_email({
      to: { email: event.email, name: "" },
      subject: event.subject,
      html: event.html,
    })
    if (email_error) {
      throw email_error.error
    }
  })
}
