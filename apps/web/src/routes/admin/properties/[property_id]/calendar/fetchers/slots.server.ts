import { query_builder } from "db/query_builder"

export function fetch_slots(property_id: number) {
  return query_builder
    .selectFrom("slot")
    .where("slot.property_id", "=", property_id)
    .select([
      "slot.id",
      "slot.start_date",
      "slot.end_date",
      "slot.state",
      "slot.visitant_id",
    ])
    .orderBy("slot.start_date", "asc")
    .execute()
}

export type Slot = Awaited<ReturnType<typeof fetch_slots>>[number]
