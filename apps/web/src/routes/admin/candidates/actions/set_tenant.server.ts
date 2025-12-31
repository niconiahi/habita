import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"
export const InputSchema = v.object({
  candidate_id: ForceNumberSchema,
  property_id: ForceNumberSchema,
})
export async function set_tenant(form_data: FormData) {
  const { candidate_id, property_id } = v.parse(
    InputSchema,
    {
      candidate_id: form_data.get("candidate_id"),
      property_id: form_data.get("property_id"),
    },
  )
  await query_builder.transaction().execute(async (tx) => {
    await tx
      .deleteFrom("access")
      .where("property_id", "=", property_id)
      .where("type", "=", ACCESS_TYPE.TENANT)
      .execute()
    await tx
      .insertInto("access")
      .values({
        user_id: candidate_id,
        property_id,
        type: ACCESS_TYPE.TENANT,
        created_at: now,
        updated_at: now,
      })
      .execute()
  })
  return { redirect_to: "/admin/candidates" }
}
