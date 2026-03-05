import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  warranty_id: ForceNumberSchema,
  guarantor_name: v.string(),
  guarantor_dni: v.string(),
  guarantor_email: v.string(),
})

export async function add_income_guarantor(
  form_data: FormData,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        add_income_guarantor: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [transaction_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      const income_warranty = await tx
        .selectFrom("income_warranty")
        .select("id")
        .where(
          "income_warranty.warranty_id",
          "=",
          input.warranty_id,
        )
        .executeTakeFirstOrThrow()
      await tx
        .insertInto("income_warranty_guarantor")
        .values({
          income_warranty_id: income_warranty.id,
          guarantor_name: input.guarantor_name,
          guarantor_dni: input.guarantor_dni,
          guarantor_email: input.guarantor_email,
          created_at: now,
          updated_at: now,
        })
        .execute()
    }),
  )
  if (transaction_error) {
    logger.error(transaction_error.message, { warranty_id: input.warranty_id, guarantor_dni: input.guarantor_dni }, transaction_error)
    return [
      {
        add_income_guarantor: {
          execution: "Error al agregar el garante",
        },
      },
      null,
    ] as const
  }
  return [null, null] as const
}
