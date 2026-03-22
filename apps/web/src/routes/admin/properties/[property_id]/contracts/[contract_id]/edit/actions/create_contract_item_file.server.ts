import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"

const InputSchema = v.object({
  contract_item_id: ForceNumberSchema,
  file: v.instance(File),
})

export async function create_contract_item_file(
  form_data: FormData,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        create_contract_item_file: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [transaction_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      const content = Buffer.from(
        await input.file.arrayBuffer(),
      )
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
        file_id = file.id
      }
      await tx
        .insertInto("contract_item_file")
        .values({
          file_id,
          contract_item_id: input.contract_item_id,
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
      { contract_item_id: input.contract_item_id },
      transaction_error,
    )
    return [
      {
        create_contract_item_file: {
          execution: "Error al crear el archivo del ítem",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
