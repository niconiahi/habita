import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"

const InputSchema = v.object({
  warranty_id: ForceNumberSchema,
  guarantor_name: v.string(),
  guarantor_dni: v.string(),
  guarantor_email: v.string(),
})

export async function add_income_guarantor(
  form_data: FormData,
) {
  const input = v.parse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  const income_warranty = await query_builder
    .selectFrom("income_warranty")
    .select("id")
    .where(
      "income_warranty.warranty_id",
      "=",
      input.warranty_id,
    )
    .executeTakeFirstOrThrow()
  await query_builder
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
}
