import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "~/lib/server/force_number"
import { SLOT_STATE } from "~/lib/server/slot_state"

export async function update_slot(form_data: FormData) {
  const visitant_id = v.parse(
    ForceNumberSchema,
    form_data.get("visitant_id"),
  )
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  await query_builder
    .updateTable("slot")
    .set({
      visitant_id,
      state: SLOT_STATE.RESERVED,
    })
    .where("slot.id", "=", id)
    .execute()
}
