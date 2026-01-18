import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { now } from "$lib/server/now"
import { upsert_file } from "$lib/server/upsert_file"
import { PROPERTY_FILE_TYPE } from "$lib/property_file_type"

export async function create_property_file(
  form_data: FormData,
  property_id: number,
) {
  const file_ = v.parse(
    v.instance(File),
    form_data.get("file"),
  )
  await query_builder.transaction().execute(async (tx) => {
    const file_id = await upsert_file(file_, tx)
    await tx
      .insertInto("property_file")
      .values({
        type: PROPERTY_FILE_TYPE.PHOTO,
        file_id,
        property_id,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
  })
}
