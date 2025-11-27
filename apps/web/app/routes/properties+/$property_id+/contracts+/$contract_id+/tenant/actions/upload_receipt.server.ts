import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { createHash } from "node:crypto"
import { now } from "~/lib/now.server"
import { ForceNumberSchema } from "~/lib/force_number"
import { ReceiptTypeSchema } from "~/lib/receipt_type"
import {
  normalize_input,
  get_errors,
} from "~/lib/form.server"

export const InputSchema = v.object({
  contract_id: ForceNumberSchema,
  type: v.pipe(ForceNumberSchema, ReceiptTypeSchema),
  file: v.instance(File),
})

export async function execute(form_data: FormData) {
  console.log("upload_receipt.execute called")
  console.log("form_data keys:", Array.from(form_data.keys()))

  const input = v.parse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )

  console.log("input parsed:", {
    contract_id: input.contract_id,
    type: input.type,
    file_name: input.file.name,
  })

  await query_builder.transaction().execute(async (tx) => {
    const content = Buffer.from(await input.file.bytes())
    const hash = createHash("sha256")
      .update(content)
      .digest("hex")
    console.log("file hash:", hash)

    const file_record = await tx
      .insertInto("file")
      .values({
        mime: input.file.type,
        basename: input.file.name,
        content,
        created_at: now,
        updated_at: now,
        hash,
        size: input.file.size,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    console.log("file inserted, id:", file_record.id)

    const receipt = await tx
      .insertInto("receipt")
      .values({
        file_id: file_record.id,
        contract_id: input.contract_id,
        type: input.type,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    console.log("receipt inserted, id:", receipt.id)
  })

  console.log("transaction completed")
}

export const upload_receipt = {
  execute,
  get_errors: (error: v.ValiError<typeof InputSchema>) => {
    return get_errors<typeof InputSchema>(error)
  },
}
