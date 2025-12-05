import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "~/lib/force_number"

export async function destroy_contract(
  form_data: FormData,
) {
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  await query_builder
    .deleteFrom("contract")
    .where("contract.id", "=", id)
    .execute()
}
