import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"

export async function create_contract_item_file(
  form_data: FormData,
) {
  const contract_item_id = v.parse(
    ForceNumberSchema,
    form_data.get("contract_item_id"),
  )
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
      .insertInto("contract_item_file")
      .values({
        file_id,
        contract_item_id,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
  })
}
