import { createHash } from "node:crypto"
import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import { now } from "$lib/server/now"
import { ReceiptTypeSchema } from "$lib/receipt_type"

const InputSchema = v.object({
  contract_id: ForceNumberSchema,
  type: v.pipe(ForceNumberSchema, ReceiptTypeSchema),
  file: v.instance(File),
})

export async function upload_receipt(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        upload_receipt: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [transaction_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      const content = Buffer.from(await input.file.bytes())
      const hash = createHash("sha256")
        .update(content)
        .digest("hex")
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
      await tx
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
    }),
  )
  if (transaction_error) {
    logger.error(
      transaction_error.message,
      {
        contract_id: input.contract_id,
        receipt_type: input.type,
      },
      transaction_error,
    )
    return [
      {
        upload_receipt: {
          execution: "Error al subir el comprobante",
        },
      },
      null,
    ] as const
  }

  logger.info("receipt uploaded", {
    contract_id: input.contract_id,
    receipt_type: input.type,
  })

  return [null, null] as const
}
