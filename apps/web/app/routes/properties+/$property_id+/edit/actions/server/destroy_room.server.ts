import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "~/lib/server/force_number.server"

export async function destroy_room(form_data: FormData) {
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  await query_builder
    .deleteFrom("room")
    .where("room.id", "=", id)
    .execute()
}
