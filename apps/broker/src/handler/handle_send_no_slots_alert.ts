import type { EachMessagePayload, Producer } from "kafkajs"
import * as v from "valibot"
import { logger } from "../lib/logger"
import { send_email } from "../lib/send_email"
import { SendNoSlotsAlertEvent } from "../event/send_no_slots_alert"
import { dlq_topic } from "../lib/topic"
import { deliver_email } from "../consumer/deliver_email"

export async function handle_send_no_slots_alert(
  payload: EachMessagePayload,
  producer: Producer,
) {
  const { message, topic } = payload
  const raw = JSON.parse(message.value!.toString())

  const validation = v.safeParse(
    SendNoSlotsAlertEvent,
    raw,
  )
  if (!validation.success) {
    logger.error("malformed send_no_slots_alert event", {
      issues: JSON.stringify(
        v.flatten(validation.issues),
      ),
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

  const html = `<p>Hola ${event.manager_name},</p>
<p>${event.visitant_name} intentó agendar una visita a la propiedad ubicada en ${event.property_address}, pero no encontró turnos disponibles.</p>
<p>Podés agregar nuevos turnos desde el panel de visitas:<br><a href="${event.visits_url}">${event.visits_url}</a></p>`

  await deliver_email(payload, producer, async () => {
    const [error] = await send_email({
      to: {
        email: event.manager_email,
        name: event.manager_name,
      },
      subject: `Sin turnos disponibles - ${event.property_address}`,
      html,
    })
    if (error) {
      throw error.error
    }
  })
}
