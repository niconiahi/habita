import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { ForceNumberSchema } from "$lib/force_number"
import { SLOT_STATE } from "$lib/slot_state"

const CreateSlotSchema = v.object({
  property_id: ForceNumberSchema,
  host_id: ForceNumberSchema,
  date: v.pipe(v.string(), v.nonEmpty()),
  start_time: v.pipe(v.string(), v.nonEmpty()),
  end_time: v.pipe(v.string(), v.nonEmpty()),
})

export async function create_slot(form_data: FormData) {
  const input = v.parse(CreateSlotSchema, {
    property_id: form_data.get("property_id"),
    host_id: form_data.get("host_id"),
    date: form_data.get("date"),
    start_time: form_data.get("start_time"),
    end_time: form_data.get("end_time"),
  })

  const [start_hours, start_minutes] = input.start_time
    .split(":")
    .map(Number)
  const [end_hours, end_minutes] = input.end_time.split(":").map(Number)

  const start_date = new Date(input.date)
  start_date.setHours(start_hours, start_minutes, 0, 0)

  const end_date = new Date(input.date)
  end_date.setHours(end_hours, end_minutes, 0, 0)

  const now = new Date()

  await query_builder
    .insertInto("slot")
    .values({
      property_id: input.property_id,
      host_id: input.host_id,
      state: SLOT_STATE.FREE,
      event_id: crypto.randomUUID(),
      start_date,
      end_date,
      created_at: now,
      updated_at: now,
    })
    .execute()
}
