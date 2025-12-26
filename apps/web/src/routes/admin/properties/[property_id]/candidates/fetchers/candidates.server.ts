import { query_builder } from "db/query_builder"
import { SLOT_STATE } from "$lib/slot_state"

export function fetch_candidates(property_id: number) {
  return query_builder
    .selectFrom("slot")
    .innerJoin("user", "user.id", "slot.visitant_id")
    .where("slot.property_id", "=", property_id)
    .where("slot.state", "=", SLOT_STATE.RESERVED)
    .select([
      "user.id",
      "user.email",
      "user.name",
      "user.surname",
      "user.phone_number",
    ])
    .execute()
}
export type Candidate = Awaited<
  ReturnType<typeof fetch_candidates>
>[number]
