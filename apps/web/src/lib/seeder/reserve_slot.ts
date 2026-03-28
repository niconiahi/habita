import { query_builder } from "../../../db/query_builder"
import { SLOT_STATE } from "../slot_state"

export async function reserve_slot(
  slot_id: number,
  visitant_id: number,
): Promise<void> {
  const now = new Date().toISOString()
  await query_builder
    .updateTable("slot")
    .set({
      visitant_id,
      state: SLOT_STATE.RESERVED,
      updated_at: now,
    })
    .where("id", "=", slot_id)
    .execute()
  console.log(
    `reserved slot ${slot_id} for visitant ${visitant_id}`,
  )
}
