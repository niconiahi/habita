import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { normalize_input } from "$lib/server/form"
import { publish_delete_object } from "$lib/server/broker/producer/publish_delete_object"
import { delete_object } from "$lib/server/object_store"
import { logger } from "$lib/telemetry/logger"

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

  const file = await query_builder
    .selectFrom("file")
    .select("hash")
    .where("id", "=", input.id)
    .executeTakeFirst()

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

  if (file) {
    const shared = await query_builder
      .selectFrom("file")
      .where("hash", "=", file.hash)
      .select("id")
      .executeTakeFirst()
    if (!shared) {
      const key = `files/${file.hash}`
      const [delete_error] = await delete_object(key)
      if (delete_error) {
        logger.error(
          "failed to delete object, requeueing",
          { key },
          delete_error.error,
        )
        await publish_delete_object(key)
      }
    }
  }

  return [null, null] as const
}
