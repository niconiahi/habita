import type { EachMessagePayload, Producer } from "kafkajs"
import * as v from "valibot"
import { logger } from "../lib/logger"
import { send_email } from "../lib/send_email"
import { SendSlotRejectedAlertEvent } from "../event/send_slot_rejected_alert"
import { dlq_topic } from "../lib/topic"
import { deliver_email } from "../consumer/deliver_email"

export async function handle_send_slot_rejected_alert(
  payload: EachMessagePayload,
  producer: Producer,
) {
  const { message, topic } = payload
  const raw = JSON.parse(message.value!.toString())

  const validation = v.safeParse(
    SendSlotRejectedAlertEvent,
    raw,
  )
  if (!validation.success) {
    logger.error(
      "malformed send_slot_rejected_alert event",
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

  const text = `Hola ${event.visitant_name},

Lamentamos informarte que tu reserva de visita a la propiedad ubicada en ${event.property_address} no fue aprobada.

Fecha solicitada: ${date}
Horario solicitado: ${start_time} - ${end_time}

Podés intentar reservar otro horario disponible desde la plataforma.`

  await deliver_email(payload, producer, async () => {
    const [error] = await send_email({
      to: {
        email: event.visitant_email,
        name: event.visitant_name,
      },
      subject: `Tu reserva de visita no fue aprobada - ${event.property_address}`,
      text,
    })
    if (error) {
      throw error.error
    }
  })
}
