import {
  context,
  propagation,
  type Span,
} from "@opentelemetry/api"
import * as v from "valibot"
import { display_location } from "$lib/display_location"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { normalize_input } from "$lib/server/form"
import {
  escape_ics_text,
  format_ics_date,
} from "$lib/server/ics"
import { NOTIFICATION_TYPE } from "$lib/notification_type"
import { SLOT_STATE } from "$lib/slot_state"
import {
  send_email,
  SEND_EMAIL_ERROR,
} from "$lib/server/send_email"
import { logger } from "$lib/telemetry/logger"
import { USER_FILE_TYPE } from "$lib/user_file_type"
import { query_builder } from "db/query_builder"
import { decrypt } from "$lib/server/encryption"
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
          execution:
            "Se requiere un informe crediticio",
        },
      },
      null,
    ] as const
  }

  span.setAttribute("slot.id", id)
  span.setAttribute("visitant.id", visitant_id)
  logger.info("updating slot")

  const [tx_error, tx_result] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      const slot = await tx
        .updateTable("slot")
        .set({
          visitant_id,
          state: SLOT_STATE.RESERVED,
        })
        .where("slot.id", "=", id)
        .returning([
          "slot.start_date",
          "slot.end_date",
          "slot.host_id",
          "slot.property_id",
          "slot.visitant_id",
        ])
        .executeTakeFirstOrThrow()
      const now = new Date()
      await tx
        .insertInto("notification")
        .values({
          type: NOTIFICATION_TYPE.PROPERTY_VISIT,
          href: "/admin/candidates",
          property_id: slot.property_id,
          created_at: now,
          updated_at: now,
        })
        .execute()
      return slot
    }),
  )
  if (tx_error) {
    logger.error(tx_error.message, { slot_id: id, visitant_id, property_id }, tx_error)
    return [
      {
        update_slot: {
          execution:
            "Error al actualizar la reserva",
        },
      },
      null,
    ] as const
  }
  const slot = tx_result

  logger.info("notification created")
  span.setAttribute(
    "slot.start_date",
    slot.start_date.toISOString(),
  )
  span.setAttribute(
    "slot.end_date",
    slot.end_date.toISOString(),
  )
  span.setAttribute("host.id", slot.host_id)
  logger.info("slot updated")

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
          execution:
            "No se encontró la propiedad",
        },
      },
      null,
    ] as const
  }

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
  logger.info("ics file created")

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
  span.setAttribute(
    "email.visitant_recipient",
    visitant.email,
  )
  span.setAttribute("email.host_recipient", host.email)
  span.setAttribute("email.subject", summary)

  const otel_headers: Record<string, string> = {}
  propagation.inject(context.active(), otel_headers)
  const [[visitant_email_error], [host_email_error]] =
    await Promise.all([
      send_email(
        {
          to: visitant,
          subject: summary,
          text: visitant_text,
          content,
        },
        otel_headers,
      ),
      send_email(
        {
          to: host,
          subject: summary,
          text: host_text,
          content,
        },
        otel_headers,
      ),
    ])
  if (visitant_email_error) {
    if (
      visitant_email_error.type ===
      SEND_EMAIL_ERROR.FETCH_FAILED
    ) {
      logger.error(
        visitant_email_error.error.message,
        {
          visitant_id,
          error_type: SEND_EMAIL_ERROR.FETCH_FAILED,
        },
        visitant_email_error.error,
      )
    }
    if (
      visitant_email_error.type ===
      SEND_EMAIL_ERROR.SERVICE_ERROR
    ) {
      logger.error(
        visitant_email_error.error.message,
        {
          visitant_id,
          error_type: SEND_EMAIL_ERROR.SERVICE_ERROR,
        },
        visitant_email_error.error,
      )
    }
  }
  if (host_email_error) {
    if (
      host_email_error.type ===
      SEND_EMAIL_ERROR.FETCH_FAILED
    ) {
      logger.error(
        host_email_error.error.message,
        {
          host_id: slot.host_id,
          error_type: SEND_EMAIL_ERROR.FETCH_FAILED,
        },
        host_email_error.error,
      )
    }
    if (
      host_email_error.type ===
      SEND_EMAIL_ERROR.SERVICE_ERROR
    ) {
      logger.error(
        host_email_error.error.message,
        {
          host_id: slot.host_id,
          error_type: SEND_EMAIL_ERROR.SERVICE_ERROR,
        },
        host_email_error.error,
      )
    }
  }
  logger.info("slot booking completed")

  return [null, null] as const
}
