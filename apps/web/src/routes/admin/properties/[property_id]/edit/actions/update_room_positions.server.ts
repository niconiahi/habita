import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { now } from "$lib/server/now"

const InputSchema = v.object({
  positions: v.pipe(
    v.string(),
    v.transform((val) => JSON.parse(val)),
    v.array(
      v.object({
        room_id: v.number(),
        position_x: v.number(),
        position_y: v.number(),
      }),
    ),
  ),
})

export async function update_room_positions(
  form_data: FormData,
) {
  const { positions } = v.parse(InputSchema, {
    positions: form_data.get("positions"),
  })
  for (const pos of positions) {
    await query_builder
      .insertInto("room_map")
      .values({
        room_id: pos.room_id,
        position_x: String(pos.position_x),
        position_y: String(pos.position_y),
        created_at: now,
        updated_at: now,
      })
      .onConflict((oc) =>
        oc.column("room_id").doUpdateSet({
          position_x: String(pos.position_x),
          position_y: String(pos.position_y),
          updated_at: now,
        }),
      )
      .execute()
  }
}
