import { query_builder } from "db/query_builder"
import { decrypt } from "$lib/server/encryption"
import { SLOT_STATE } from "$lib/slot_state"

export async function fetch_candidates(
  property_id: number,
) {
  const candidates = await query_builder
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
  return candidates.map((candidate) => ({
    ...candidate,
    name: decrypt(candidate.name),
    surname: decrypt(candidate.surname),
    phone_number: candidate.phone_number
      ? decrypt(candidate.phone_number)
      : null,
  }))
}
export type Candidate = Awaited<
  ReturnType<typeof fetch_candidates>
>[number]
