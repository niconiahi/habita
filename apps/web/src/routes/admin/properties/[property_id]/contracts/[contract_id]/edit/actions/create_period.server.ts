import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"

export async function create_period(
  form_data: FormData,
  contract_id: number,
) {
  const price = v.parse(
    ForceNumberSchema,
    form_data.get("price"),
  )
  await query_builder
    .insertInto("period")
    .values({
      contract_id,
      price,
      created_at: now,
      updated_at: now,
    })
    .execute()
}
