import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { now } from "~/lib/now"
import { PROPERTY_FILE_TYPE } from "~/lib/server/property_file_type.server"

export async function create_property_file(
  form_data: FormData,
  property_id: number,
) {
  const file_ = v.parse(
    v.instance(File),
    form_data.get("file"),
  )
  await query_builder.transaction().execute(async (tx) => {
    const content = Buffer.from(await file_.bytes())
    const hash = Bun.CryptoHasher.hash(
      "sha256",
      content,
      "hex",
    )
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
