import type { EachMessagePayload, Producer } from "kafkajs"
import * as v from "valibot"
import { logger } from "../../../telemetry/logger"
import { send_email } from "../../send_email"
import { SendSigningRequestEvent } from "../events/send_signing_request"
import { dlq_topic } from "../topic"
import { deliver_email } from "./deliver_email"

export async function handle_send_signing_request(
  payload: EachMessagePayload,
  producer: Producer,
) {
  const { message, topic } = payload
  const raw = JSON.parse(message.value!.toString())

  const validation = v.safeParse(
    SendSigningRequestEvent,
    raw,
  )
  if (!validation.success) {
    logger.error("malformed send_signing_request event", {
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
    for (const recipient of event.recipients) {
      const [email_error] = await send_email({
        type: "html",
        to: recipient,
        subject: event.subject,
        html: event.html,
      })
      if (email_error) {
        throw email_error.error
      }
    }
  })
}
