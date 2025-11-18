import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "~/lib/force_number.server"
import { SLOT_STATE } from "~/lib/slot_state.server"
import { create_ics, InviteeSchema } from "~/lib/ics.server"
import { fetch_property } from "~/routes/properties+/fetchers/server/property.server"
import { send_calendar_invite } from "~/lib/send_calendar_invite.server"
import { display_location } from "~/lib/display_location"

export async function update_slot(
  form_data: FormData,
  property_id: number,
) {
  const visitant_id = v.parse(
    ForceNumberSchema,
    form_data.get("visitant_id"),
  )
  const slot_id = v.parse(
    ForceNumberSchema,
    form_data.get("id"),
  )
  const slot = await query_builder
    .updateTable("slot")
    .set({
      visitant_id,
      state: SLOT_STATE.RESERVED,
    })
    .where("slot.id", "=", slot_id)
    .returning([
      "slot.start_date",
      "slot.end_date",
      "slot.host_id",
      "slot.property_id",
      "slot.visitant_id",
    ])
    .executeTakeFirstOrThrow()
  const host = v.parse(
    InviteeSchema,
    await query_builder
      .selectFrom("user")
      .select(["email", "name"])
      .where("id", "=", slot.host_id)
      .executeTakeFirstOrThrow(),
  )
  const visitant = v.parse(
    InviteeSchema,
    await query_builder
      .selectFrom("user")
      .select(["email", "name"])
      .where("id", "=", slot.visitant_id)
      .executeTakeFirstOrThrow(),
  )
  const property = await fetch_property(property_id)
  if (!property) {
    throw new Response("property should exist", {
      status: 404,
    })
  }
  const summary = `Visita a la propiedad ubicada en ${property.location.road} ${property.location.house_number}`
  const content = create_ics({
    start_date: slot.start_date,
    end_date: slot.end_date,
    summary,
    location: display_location(property.location),
    host,
    visitant,
  })

  const text = `Hello ${visitant.name},

You have been invited to visit the property located at ${property.location.road} ${property.location.house_number}.

Date: ${slot.start_date.toLocaleDateString()}
Time: ${slot.start_date.toLocaleTimeString()} - ${slot.end_date.toLocaleTimeString()}

Please open the attached calendar invitation to add this event to your calendar.

Best regards,
${host.name}`
  await send_calendar_invite({
    host: host.email,
    visitant: visitant.email,
    subject: summary,
    text,
    content,
  })
}
