import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { ForceNumberSchema } from "$lib/force_number"
import { RoomTypeSchema } from "$lib/room_type"

export async function update_room(form_data: FormData) {
  const length = v.parse(
    ForceNumberSchema,
    form_data.get("length"),
  )
  const width = v.parse(
    ForceNumberSchema,
    form_data.get("width"),
  )
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  const room_type = v.parse(
    v.pipe(v.string(), v.transform(Number), RoomTypeSchema),
    form_data.get("type"),
  )
  await query_builder
    .updateTable("room")
    .set({
      width,
      length,
      updated_at: new Date(),
      type: room_type,
    })
    .where("room.id", "=", id)
    .execute()
}
