import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { display_location } from "$lib/display_location"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { publish_send_booking_confirmation } from "$lib/server/broker/producer/publish_send_booking_confirmation"
import { decrypt } from "$lib/server/encryption"
import { normalize_input } from "$lib/server/form"
import {
  escape_ics_text,
  format_ics_date,
} from "$lib/server/ics"
import { SLOT_STATE } from "$lib/slot_state"
import { logger } from "$lib/telemetry/logger"
import { fetch_property } from "../../../../../../properties/fetchers/property.server"

const InviteeSchema = v.object({
  email: v.string(),
  name: v.string(),
})

const InputSchema = v.object({
  id: ForceNumberSchema,
})

export async function confirm_slot(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        confirm_slot: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const { id } = input_validation.output

  const [update_error, slot] = await safe_async(
    query_builder
      .updateTable("slot")
      .set({ state: SLOT_STATE.CONFIRMED })
      .where("slot.id", "=", id)
      .where("slot.state", "=", SLOT_STATE.RESERVED)
      .returning([
        "slot.start_date",
        "slot.end_date",
        "slot.host_id",
        "slot.visitant_id",
        "slot.property_id",
      ])
      .executeTakeFirstOrThrow(),
  )
  if (update_error) {
    logger.error(
      update_error.message,
      { slot_id: id },
      update_error,
    )
    return [
      {
        confirm_slot: {
          execution: "No se pudo confirmar el turno",
        },
      },
      null,
    ] as const
  }

  const host_row = await query_builder
    .selectFrom("user")
    .select(["email", "name"])
    .where("id", "=", slot.host_id)
    .executeTakeFirstOrThrow()
  const host = v.parse(InviteeSchema, {
    email: host_row.email,
    name: decrypt(host_row.name),
  })

  const visitant_row = await query_builder
    .selectFrom("user")
    .select(["email", "name"])
    .where("id", "=", slot.visitant_id!)
    .executeTakeFirstOrThrow()
  const visitant = v.parse(InviteeSchema, {
    email: visitant_row.email,
    name: decrypt(visitant_row.name),
  })

  const property = await fetch_property(slot.property_id)
  if (!property) {
    logger.error("property not found", {
      property_id: slot.property_id,
    })
    return [
      {
        confirm_slot: {
          execution: "No se encontró la propiedad",
        },
      },
      null,
    ] as const
  }

  const summary = `Visita a la propiedad ubicada en ${display_location(property.location)}`
  const content = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Habita//Visita de propiedad//ES
METHOD:REQUEST
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${crypto.randomUUID()}
DTSTAMP:${format_ics_date(new Date())}
DTSTART:${format_ics_date(slot.start_date)}
DTEND:${format_ics_date(slot.end_date)}
SUMMARY:${escape_ics_text(summary)}
LOCATION:${escape_ics_text(display_location(property.location))}
ORGANIZER;CN=Habita:MAILTO:notifications@habita.rent
ATTENDEE;CN=${host.name};RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:MAILTO:${host.email}
ATTENDEE;CN=${visitant.name};RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:MAILTO:${visitant.email}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`

  const visitant_text = `Hola ${visitant.name},

Tu visita a la propiedad ubicada en ${property.location.road} ${property.location.house_number} fue confirmada.

Fecha: ${slot.start_date.toLocaleDateString()}
Horario: ${slot.start_date.toLocaleTimeString()} - ${slot.end_date.toLocaleTimeString()}

Te adjuntamos una invitación al calendario con los detalles.`
  const host_text = `Hola ${host.name},

La visita de ${visitant.name} a tu propiedad ubicada en ${property.location.road} ${property.location.house_number} fue confirmada.

Fecha: ${slot.start_date.toLocaleDateString()}
Horario: ${slot.start_date.toLocaleTimeString()} - ${slot.end_date.toLocaleTimeString()}

Te adjuntamos una invitación al calendario con los detalles.`

  await publish_send_booking_confirmation(id, {
    visitant,
    host,
    subject: summary,
    visitant_text,
    host_text,
    content,
  })

  logger.info("slot confirmed by admin", {
    slot_id: id,
    property_id: slot.property_id,
    visitant_id: slot.visitant_id,
  })

  return [null, null] as const
}
