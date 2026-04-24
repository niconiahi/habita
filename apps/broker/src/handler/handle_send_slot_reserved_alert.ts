import type { EachMessagePayload, Producer } from "kafkajs"
import * as v from "valibot"
import { logger } from "../lib/logger"
import { send_email } from "../lib/send_email"
import { SendSlotReservedAlertEvent } from "../event/send_slot_reserved_alert"
import { dlq_topic } from "../lib/topic"
import { deliver_email } from "../consumer/deliver_email"

export async function handle_send_slot_reserved_alert(
  payload: EachMessagePayload,
  producer: Producer,
) {
  const { message, topic } = payload
  const raw = JSON.parse(message.value!.toString())

  const validation = v.safeParse(
    SendSlotReservedAlertEvent,
    raw,
  )
  if (!validation.success) {
    logger.error(
      "malformed send_slot_reserved_alert event",
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
  const start = new Date(event.start_date)
  const end = new Date(event.end_date)
  const date = start.toLocaleDateString("es-AR")
  const start_time = start.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const end_time = end.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const text = `Hola ${event.host_name},

${event.visitant_name} ha reservado una visita a la propiedad ubicada en ${event.property_address}.

Fecha: ${date}
Horario: ${start_time} - ${end_time}

La visita queda pendiente de tu aprobación. Ingresá al panel de administración para confirmarla.`

  await deliver_email(payload, producer, async () => {
    const [error] = await send_email({
      to: { email: event.host_email, name: event.host_name },
      subject: `Nueva reserva de visita pendiente de aprobación - ${event.property_address}`,
      text,
    })
    if (error) {
      throw error.error
    }
  })
}
