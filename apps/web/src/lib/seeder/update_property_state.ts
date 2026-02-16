import { query_builder } from "../../../db/query_builder"

export async function update_property_state(
  property_id: number,
  state: number,
): Promise<void> {
  const now = new Date().toISOString()
  await query_builder
    .updateTable("property")
    .set({
      state,
      updated_at: now,
    })
    .where("id", "=", property_id)
    .execute()
  console.log(
    `updated property ${property_id} state to ${state}`,
  )
}
