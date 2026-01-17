import {
  context,
  propagation,
  type Span,
} from "@opentelemetry/api"
import * as v from "valibot"
import { display_location } from "$lib/display_location"
import { ForceNumberSchema } from "$lib/force_number"
import {
  normalize_input,
  get_errors,
} from "$lib/server/form"
import {
  escape_ics_text,
  format_ics_date,
} from "$lib/server/ics"
import { NOTIFICATION_TYPE } from "$lib/notification_type"
import { SLOT_STATE } from "$lib/slot_state"
import { logger } from "$lib/server/telemetry/logger"
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

async function execute(form_data: FormData, span: Span) {
  const { visitant_id, id, property_id } = v.parse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  const user_files = await fetch_user_files(visitant_id)
  const has_credit_report = user_files.some(
    (file) => file.type === USER_FILE_TYPE.CREDIT_REPORT,
  )
  if (!has_credit_report) {
    throw new Response("credit report required", {
      status: 403,
    })
  }
  span.setAttribute("slot.id", id)
  span.setAttribute("visitant.id", visitant_id)
  logger.info("updating slot")
  const slot = await query_builder
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
  await query_builder
    .insertInto("notification")
    .values({
      type: NOTIFICATION_TYPE.PROPERTY_VISIT,
      href: "/admin/candidates",
      property_id: slot.property_id,
      created_at: now,
      updated_at: now,
    })
    .execute()
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
    logger.error("property not found")
    throw new Response("property should exist", {
      status: 404,
    })
  }
  span.setAttribute(
    "property.location",
    display_location(property.location),
  )
  const summary = `Visita a la propiedad ubicada en ${display_location(property.location)}`
  const content = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Memudo//Visita de propiedad//ES
METHOD:REQUEST
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${crypto.randomUUID()}
DTSTAMP:${format_ics_date(new Date())}
DTSTART:${format_ics_date(slot.start_date)}
DTEND:${format_ics_date(slot.end_date)}
SUMMARY:${escape_ics_text(summary)}
LOCATION:${escape_ics_text(display_location(property.location))}
ORGANIZER;CN=Habita:MAILTO:bookings@habita.rent
ATTENDEE;CN=${host.name};RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:MAILTO:${host.email}
ATTENDEE;CN=${visitant.name};RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:MAILTO:${visitant.email}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`
  logger.info("ics file created")
  const text = `Hello ${visitant.name},

You have been invited to visit the property located at ${property.location.road} ${property.location.house_number}.

Date: ${slot.start_date.toLocaleDateString()}
Time: ${slot.start_date.toLocaleTimeString()} - ${slot.end_date.toLocaleTimeString()}

Please open the attached calendar invitation to add this event to your calendar.

Best regards,
${host.name}`
  span.setAttribute("email.recipient", visitant.email)
  span.setAttribute("email.subject", summary)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  propagation.inject(context.active(), headers)
  const response = await fetch(
    "http://go:8081/send-email",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        host,
        visitant,
        subject: summary,
        text,
        content,
      }),
    },
  )
  if (!response.ok) {
    const message = "email service returned error"
    logger.error(message)
    throw new Error(message)
  }
  logger.info("email sent via go service")
  logger.info("slot booking completed")
}

export const update_slot = {
  execute,
  get_errors: (error: v.ValiError<typeof InputSchema>) =>
    get_errors<typeof InputSchema>(error),
}
