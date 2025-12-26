import * as v from "valibot"
import { ContractFileTypeSchema } from "$lib/contract_file_type"
import { ForceNumberSchema } from "$lib/force_number"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"

export async function create_file(form_data: FormData) {
  const contract_id = v.parse(
    ForceNumberSchema,
    form_data.get("contract_id"),
  )
  const file_type = v.parse(
    ContractFileTypeSchema,
    Number(form_data.get("file_type")),
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
      .insertInto("contract_file")
      .values({
        file_id: file.id,
        contract_id,
        type: file_type,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
  })
}
