import type { Span } from "@opentelemetry/api"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { display_location } from "$lib/display_location"
import type { PropertyVisitNotification } from "$lib/fetchers/notifications.schemas"
import { ForceNumberSchema } from "$lib/force_number"
import { NOTIFICATION_TYPE } from "$lib/notification_type"
import { safe_async } from "$lib/safe_async"
import { publish_send_booking_confirmation } from "$lib/server/broker/producer/publish_send_booking_confirmation"
import { decrypt } from "$lib/server/encryption"
import { normalize_input } from "$lib/server/form"
import {
  escape_ics_text,
  format_ics_date,
} from "$lib/server/ics"
import {
  NOTIFICATION_EVENT,
  notification_emitter,
} from "$lib/server/notification_emitter"
import { SLOT_STATE } from "$lib/slot_state"
import { logger } from "$lib/telemetry/logger"
import { USER_FILE_TYPE } from "$lib/user_file_type"
import { fetch_property } from "../../../fetchers/property.server"
import { fetch_user_files } from "../../../fetchers/user_files.server"

const InviteeSchema = v.object({
  email: v.string(),
  name: v.string(),
})

export const InputSchema = v.object({
  id: ForceNumberSchema,
  visitant_id: ForceNumberSchema,
  property_id: ForceNumberSchema,
})

export async function update_slot(
  form_data: FormData,
  span: Span,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        update_slot: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output
  const { visitant_id, id, property_id } = input

  const user_files = await fetch_user_files(visitant_id)
  const has_credit_report = user_files.some(
    (file) => file.type === USER_FILE_TYPE.CREDIT_REPORT,
  )
  if (!has_credit_report) {
    return [
      {
        update_slot: {
          execution: "Se requiere un informe crediticio",
        },
      },
      null,
    ] as const
  }

  span.setAttribute("slot.id", id)
  span.setAttribute("visitant.id", visitant_id)

  const notification_type = NOTIFICATION_TYPE.PROPERTY_VISIT
  const [tx_error, tx_result] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      const slot = await tx
        .updateTable("slot")
        .set({
          visitant_id,
          state: SLOT_STATE.RESERVED,
        })
        .where("slot.id", "=", id)
        .where("slot.state", "=", SLOT_STATE.FREE)
        .returning([
          "slot.start_date",
          "slot.end_date",
          "slot.host_id",
          "slot.property_id",
          "slot.visitant_id",
        ])
        .executeTakeFirstOrThrow()
      const now = new Date()
      const notification = await tx
        .insertInto("notification")
        .values({
          type: notification_type,
          href: "/admin/candidates",
          property_id: slot.property_id,
          created_at: now,
          updated_at: now,
        })
        .returning([
          "notification.id",
          "notification.type",
          "notification.href",
          "notification.property_id",
          "notification.created_at",
        ])
        .executeTakeFirstOrThrow()
      return { slot, notification }
    }),
  )
  if (tx_error) {
    logger.error(
      tx_error.message,
      { slot_id: id, visitant_id, property_id },
      tx_error,
    )
    return [
      {
        update_slot: {
          execution:
            "El turno ya fue reservado por otro visitante",
        },
      },
      null,
    ] as const
  }
  const { slot, notification } = tx_result

  span.setAttribute(
    "slot.start_date",
    slot.start_date.toISOString(),
  )
  span.setAttribute(
    "slot.end_date",
    slot.end_date.toISOString(),
  )
  span.setAttribute("host.id", slot.host_id)

  const host_row = await query_builder
    .selectFrom("user")
    .select(["email", "name"])
    .where("id", "=", slot.host_id)
    .executeTakeFirstOrThrow()
  const host = v.parse(InviteeSchema, {
    email: host_row.email,
    name: decrypt(host_row.name),
  })
  span.setAttribute("host.email", host.email)
  span.setAttribute("host.name", host.name)

  const visitant_row = await query_builder
    .selectFrom("user")
    .select(["email", "name"])
    .where("id", "=", slot.visitant_id)
    .executeTakeFirstOrThrow()
  const visitant = v.parse(InviteeSchema, {
    email: visitant_row.email,
    name: decrypt(visitant_row.name),
  })
  span.setAttribute("visitant.email", visitant.email)
  span.setAttribute("visitant.name", visitant.name)

  const property = await fetch_property(property_id)
  if (!property) {
    logger.error("property not found", { property_id })
    return [
      {
        update_slot: {
          execution: "No se encontró la propiedad",
        },
      },
      null,
    ] as const
  }

  notification_emitter.emit(
    NOTIFICATION_EVENT,
    {
      id: notification.id,
      href: notification.href,
      type: notification_type,
      property_id: notification.property_id,
      created_at: notification.created_at.toISOString(),
      location: {
        road: property.location.road,
        house_number: property.location.house_number,
      },
    } satisfies PropertyVisitNotification,
  )

  span.setAttribute(
    "property.location",
    display_location(property.location),
  )
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

  const visitant_text = `Hello ${visitant.name},

You have been invited to visit the property located at ${property.location.road} ${property.location.house_number}.

Date: ${slot.start_date.toLocaleDateString()}
Time: ${slot.start_date.toLocaleTimeString()} - ${slot.end_date.toLocaleTimeString()}

Please open the attached calendar invitation to add this event to your calendar.

Best regards,
${host.name}`
  const host_text = `Hello ${host.name},

${visitant.name} has booked a visit to your property located at ${property.location.road} ${property.location.house_number}.

Date: ${slot.start_date.toLocaleDateString()}
Time: ${slot.start_date.toLocaleTimeString()} - ${slot.end_date.toLocaleTimeString()}

Please open the attached calendar invitation to add this event to your calendar.`
  await publish_send_booking_confirmation(id, {
    visitant,
    host,
    subject: summary,
    visitant_text,
    host_text,
    content,
  })

  logger.info("property visit booked", {
    slot_id: id,
    property_id,
    visitant_id,
  })

  return [null, null] as const
}
