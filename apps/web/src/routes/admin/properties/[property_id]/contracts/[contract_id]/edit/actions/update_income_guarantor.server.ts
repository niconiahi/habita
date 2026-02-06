import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"

const InputSchema = v.object({
  id: ForceNumberSchema,
  guarantor_name: v.string(),
  guarantor_dni: v.string(),
  guarantor_email: v.string(),
})

export async function update_income_guarantor(form_data: FormData) {
  const input = v.parse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  await query_builder
    .updateTable("income_warranty_guarantor")
    .set({
      guarantor_name: input.guarantor_name,
      guarantor_dni: input.guarantor_dni,
      guarantor_email: input.guarantor_email,
      updated_at: now,
    })
    .where("income_warranty_guarantor.id", "=", input.id)
    .execute()
}
