import { query_builder } from "db/query_builder"
import { decrypt } from "$lib/server/encryption"

export async function fetch_slots(property_id: number) {
  const slots = await query_builder
    .selectFrom("slot")
    .leftJoin(
      "user as visitant",
      "visitant.id",
      "slot.visitant_id",
    )
    .where("slot.property_id", "=", property_id)
    .select([
      "slot.id",
      "slot.start_date",
      "slot.end_date",
      "slot.state",
      "slot.visitant_id",
      "visitant.name as visitant_name",
      "visitant.surname as visitant_surname",
      "visitant.phone_number as visitant_phone_number",
    ])
    .orderBy("slot.start_date", "asc")
    .execute()
  return slots.map((slot) => ({
    ...slot,
    visitant_name: slot.visitant_name
      ? decrypt(slot.visitant_name)
      : null,
    visitant_surname: slot.visitant_surname
      ? decrypt(slot.visitant_surname)
      : null,
    visitant_phone_number: slot.visitant_phone_number
      ? decrypt(slot.visitant_phone_number)
      : null,
  }))
}

export type Slot = Awaited<
  ReturnType<typeof fetch_slots>
>[number]
