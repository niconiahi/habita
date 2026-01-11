import { createHash } from "node:crypto"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { now } from "$lib/server/now"
import { UserFileTypeSchema } from "$lib/user_file_type"
import { query_builder } from "db/query_builder"

export async function create_file(
  form_data: FormData,
  user_id: number,
) {
  const file_ = v.parse(
    v.instance(File),
    form_data.get("file"),
  )
  const type = v.parse(
    v.pipe(ForceNumberSchema, UserFileTypeSchema),
    form_data.get("type"),
  )
  await query_builder.transaction().execute(async (tx) => {
    const content = Buffer.from(await file_.bytes())
    const hash = createHash("sha256")
      .update(content)
      .digest("hex")
    const existing_file = await tx
      .selectFrom("file")
      .select("id")
      .where("hash", "=", hash)
      .executeTakeFirst()
    let file_id: number
    if (existing_file) {
      file_id = existing_file.id
    } else {
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
      file_id = file.id
    }
    await tx
      .insertInto("user_file")
      .values({
        user_id,
        file_id,
        type,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
  })
}
