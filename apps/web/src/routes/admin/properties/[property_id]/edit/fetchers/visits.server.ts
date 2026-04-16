import { query_builder } from "db/query_builder"
import { decrypt } from "$lib/server/encryption"
import { SLOT_STATE } from "$lib/slot_state"

export function fetch_visits(property_id: number) {
  return query_builder
    .selectFrom("slot")
    .innerJoin("user", "user.id", "slot.visitant_id")
    .where("slot.property_id", "=", property_id)
    .where("slot.state", "=", SLOT_STATE.RESERVED)
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "slot.start_date",
      "slot.end_date",
    ])
    .orderBy("slot.start_date", "asc")
    .execute()
    .then((visits) =>
      visits.map((visit) => ({
        ...visit,
        name: decrypt(visit.name),
        surname: decrypt(visit.surname),
      })),
    )
}
