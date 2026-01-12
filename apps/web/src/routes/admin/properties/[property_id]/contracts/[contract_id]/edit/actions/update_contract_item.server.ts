import * as v from "valibot"
import { ContractItemStateSchema } from "$lib/contract_item_state"
import { ForceNumberSchema } from "$lib/force_number"
import { query_builder } from "db/query_builder"

export async function update_contract_item(form_data: FormData) {
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  const name = v.parse(v.string(), form_data.get("name"))
  const state = v.parse(
    v.pipe(v.string(), v.transform(Number), ContractItemStateSchema),
    form_data.get("state"),
  )
  await query_builder
    .updateTable("contract_item")
    .set({
      name,
      state,
      updated_at: new Date(),
    })
    .where("contract_item.id", "=", id)
    .execute()
}
