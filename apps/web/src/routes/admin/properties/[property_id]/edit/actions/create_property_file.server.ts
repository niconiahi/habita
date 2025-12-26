import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { now } from "$lib/server/now"
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
    const content = Buffer.from(await file_.arrayBuffer())
    const hash_buffer = await crypto.subtle.digest(
      "SHA-256",
      content,
    )
    const hash = Array.from(new Uint8Array(hash_buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
    const file = await tx
      .insertInto("file")
      .values({
        mime: file_.type,
        basename: file_.name,
        content,
        created_at: now,
        updated_at: now,
        hash,
        size: file_.size,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
    await tx
      .insertInto("property_file")
      .values({
        type: PROPERTY_FILE_TYPE.PHOTO,
        file_id: file.id,
        property_id,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
  })
}
