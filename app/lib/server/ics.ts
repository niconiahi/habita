import * as v from "valibot"
export const InviteeSchema = v.object({
  email: v.string(),
  name: v.string(),
})
type Invitee = v.InferOutput<typeof InviteeSchema>

export function create_ics({
  start_date,
  end_date,
  summary,
  location,
  host,
  visitant,
}: {
  start_date: Date
  end_date: Date
  summary: string
  location: string
  host: Invitee
  visitant: Invitee
}): string {
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Memudo//Visita de propiedad//ES
METHOD:REQUEST
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${crypto.randomUUID()}
DTSTAMP:${format_ics_date(new Date())}
DTSTART:${format_ics_date(start_date)}
DTEND:${format_ics_date(end_date)}
SUMMARY:${escape_ics_text(summary)}
LOCATION:${escape_ics_text(location)}
ORGANIZER;CN=Habita:MAILTO:bookings@habita.rent
ATTENDEE;CN=${host.name};RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:MAILTO:${host.email}
ATTENDEE;CN=${visitant.name};RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:MAILTO:${visitant.email}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`
}

function escape_ics_text(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

function format_ics_date(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(
    2,
    "0",
  )
  const seconds = String(date.getUTCSeconds()).padStart(
    2,
    "0",
  )

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}
