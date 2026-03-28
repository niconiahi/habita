import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { normalize_input } from "$lib/server/form"
import { kv } from "$lib/server/kv"
import { logger } from "$lib/telemetry/logger"

function compose_file_cache_key(id: number) {
  return `file:${id}`
}

const InputSchema = v.object({
  id: ForceNumberSchema,
  contract_id: ForceNumberSchema,
})

export async function destroy_file(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        destroy_file: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [transaction_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      await tx
        .deleteFrom("contract_file")
        .where((eb) =>
          eb.and([
            eb("contract_file.file_id", "=", input.id),
            eb(
              "contract_file.contract_id",
              "=",
              input.contract_id,
            ),
          ]),
        )
        .execute()
      await tx
        .deleteFrom("file")
        .where("file.id", "=", input.id)
        .execute()
    }),
  )
  if (transaction_error) {
    logger.error(
      transaction_error.message,
      { file_id: input.id, contract_id: input.contract_id },
      transaction_error,
    )
    return [
      {
        destroy_file: {
          execution: "Error al eliminar el archivo",
        },
      },
      null,
    ] as const
  }

  const cache_key = compose_file_cache_key(input.id)
  await kv.del(cache_key)

  return [null, null] as const
}
