import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { fail } from "@sveltejs/kit"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
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
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  try {
    await query_builder
      .transaction()
      .execute(async (tx) => {
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
      })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        {
          warranty_id: input.warranty_id,
          guarantor_dni: input.guarantor_dni,
        },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al agregar el garante",
    })
  }
}
