import { SLOT_STATE } from "../slot_state"
import { query_builder } from "../../../db/query_builder"

export async function create_slot(
  property_id: number,
  host_id: number,
  data: {
    start_date: Date
    end_date: Date
    event_id: string
  },
): Promise<number> {
  const now = new Date().toISOString()
  const slot = await query_builder
    .insertInto("slot")
    .values({
      property_id,
      host_id,
      event_id: data.event_id,
      state: SLOT_STATE.FREE,
      start_date: data.start_date,
      end_date: data.end_date,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created slot with id ${slot.id}`)
  return slot.id
}
