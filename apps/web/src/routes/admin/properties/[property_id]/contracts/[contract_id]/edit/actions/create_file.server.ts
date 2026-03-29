import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ContractFileTypeSchema } from "$lib/contract_file_type"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { upsert_file } from "$lib/server/upsert_file"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  contract_id: ForceNumberSchema,
  file_type: v.pipe(
    ForceNumberSchema,
    ContractFileTypeSchema,
  ),
  file: v.instance(File),
})

export async function create_file(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        create_file: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [transaction_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      const file_id = await upsert_file(input.file, tx)
      await tx
        .insertInto("contract_file")
        .values({
          file_id,
          contract_id: input.contract_id,
          type: input.file_type,
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
        file_type: input.file_type,
      },
      transaction_error,
    )
    return [
      {
        create_file: {
          execution: "Error al crear el archivo",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
