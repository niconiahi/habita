import { startOfMonth } from "date-fns"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { fail } from "@sveltejs/kit"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { publish_delete_object } from "$lib/server/broker/producer/publish_delete_object"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  receipt_id: ForceNumberSchema,
})

export async function delete_receipt(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
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
    return fail(400, {
      message: "Comprobante no encontrado",
    })
  }

  const receipt_month = startOfMonth(
    new Date(receipt.created_at),
  )
  const current_month = startOfMonth(new Date())
  if (receipt_month.getTime() !== current_month.getTime()) {
    return fail(400, {
      message:
        "Solo se pueden eliminar comprobantes del mes actual",
    })
  }

  try {
    await query_builder
      .transaction()
      .execute(async (tx) => {
        await tx
          .deleteFrom("receipt")
          .where("id", "=", input.receipt_id)
          .execute()
        await tx
          .deleteFrom("file")
          .where("id", "=", receipt.file_id)
          .execute()
      })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { receipt_id: input.receipt_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al eliminar el comprobante",
    })
  }

  await publish_delete_object(`files/${receipt.hash}`)

  logger.info("receipt deleted", {
    receipt_id: input.receipt_id,
  })
}
