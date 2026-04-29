import { startOfMonth } from "date-fns"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { normalize_input } from "$lib/server/form"
import { publish_delete_object } from "$lib/server/broker/producer/publish_delete_object"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  receipt_id: ForceNumberSchema,
})

export async function delete_receipt(
  form_data: FormData,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        delete_receipt: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const receipt = await query_builder
    .selectFrom("receipt")
    .innerJoin("file", "file.id", "receipt.file_id")
    .where("receipt.id", "=", input.receipt_id)
    .select([
      "receipt.id",
      "receipt.created_at",
      "file.hash",
      "file.id as file_id",
    ])
    .executeTakeFirst()

  if (!receipt) {
    return [
      {
        delete_receipt: {
          execution: "Comprobante no encontrado",
        },
      },
      null,
    ] as const
  }

  const receipt_month = startOfMonth(
    new Date(receipt.created_at),
  )
  const current_month = startOfMonth(new Date())
  if (receipt_month.getTime() !== current_month.getTime()) {
    return [
      {
        delete_receipt: {
          execution:
            "Solo se pueden eliminar comprobantes del mes actual",
        },
      },
      null,
    ] as const
  }

  const [transaction_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      await tx
        .deleteFrom("receipt")
        .where("id", "=", input.receipt_id)
        .execute()
      await tx
        .deleteFrom("file")
        .where("id", "=", receipt.file_id)
        .execute()
    }),
  )
  if (transaction_error) {
    logger.error(
      transaction_error.message,
      { receipt_id: input.receipt_id },
      transaction_error,
    )
    return [
      {
        delete_receipt: {
          execution: "Error al eliminar el comprobante",
        },
      },
      null,
    ] as const
  }

  await publish_delete_object(`files/${receipt.hash}`)

  logger.info("receipt deleted", {
    receipt_id: input.receipt_id,
  })

  return [null, null] as const
}
