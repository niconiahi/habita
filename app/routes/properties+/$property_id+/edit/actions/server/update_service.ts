import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { now } from "~/lib/now"
import { ForceNumberSchema } from "~/lib/server/force_number"
import { ServiceTypeSchema } from "~/lib/service"

export async function update_service(
  form_data: FormData,
  property_id: number,
) {
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  const code = v.parse(v.string(), form_data.get("code"))
  const type = v.parse(
    ServiceTypeSchema,
    Number(form_data.get("type")),
  )
  await query_builder
    .updateTable("service")
    .set({
      property_id,
      updated_at: now,
      id,
      type,
      code,
    })
    .where("service.id", "=", id)
    .execute()
}
