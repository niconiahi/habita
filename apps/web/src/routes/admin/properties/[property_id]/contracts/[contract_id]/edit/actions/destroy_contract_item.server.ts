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
})

export async function destroy_contract_item(
  form_data: FormData,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        destroy_contract_item: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [transaction_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      const contract_item_files = await tx
        .selectFrom("contract_item_file")
        .select("file_id")
        .where("contract_item_id", "=", input.id)
        .execute()

      await tx
        .deleteFrom("contract_item_file")
        .where("contract_item_id", "=", input.id)
        .execute()

      for (const contract_item_file of contract_item_files) {
        await tx
          .deleteFrom("file")
          .where("id", "=", contract_item_file.file_id)
          .execute()
        await kv.del(
          compose_file_cache_key(
            contract_item_file.file_id,
          ),
        )
      }

      await tx
        .deleteFrom("contract_item")
        .where("id", "=", input.id)
        .execute()
    }),
  )
  if (transaction_error) {
    logger.error(
      transaction_error.message,
      { contract_item_id: input.id },
      transaction_error,
    )
    return [
      {
        destroy_contract_item: {
          execution:
            "Error al eliminar el ítem del contrato",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
