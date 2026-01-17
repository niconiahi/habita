import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { ForceNumberSchema } from "$lib/force_number"
import { SLOT_STATE } from "$lib/slot_state"

export async function destroy_slot(form_data: FormData) {
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  await query_builder
    .deleteFrom("slot")
    .where("slot.id", "=", id)
    .where("slot.state", "=", SLOT_STATE.FREE)
    .execute()
}
