import { createHash } from "node:crypto"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { now } from "~/lib/now.server"
import { ForceNumberSchema } from "~/lib/force_number"
import { UserFileTypeSchema } from "~/lib/user_file_type"

export async function create_file(form_data: FormData) {
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
    const hash = createHash("sha256").update(content).digest("hex")
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
      .insertInto("user_file")
      .values({
        // TODO: use real user_id
        user_id: 1,
        file_id: file.id,
        type,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
  })
}
