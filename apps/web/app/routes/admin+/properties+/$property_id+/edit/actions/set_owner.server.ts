import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ACCESS_TYPE } from "~/lib/access_type"
import { ForceNumberSchema } from "~/lib/force_number"
import { now } from "~/lib/now.server"

export async function create_property_file(
  form_data: FormData,
  property_id: number,
) {
  const user_id = v.parse(
    ForceNumberSchema,
    form_data.get("user_id"),
  )
  await query_builder.transaction().execute(async (tx) => {
    tx.insertInto("access")
      .values({
        type: ACCESS_TYPE.OWNER,
        property_id,
        created_at: now,
        updated_at: now,
        user_id,
      })
      .executeTakeFirstOrThrow()
  })
}
