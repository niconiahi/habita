import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "~/lib/server/force_number"

export async function destroy_service(form_data: FormData) {
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  await query_builder
    .deleteFrom("service")
    .where("service.id", "=", id)
    .execute()
}
