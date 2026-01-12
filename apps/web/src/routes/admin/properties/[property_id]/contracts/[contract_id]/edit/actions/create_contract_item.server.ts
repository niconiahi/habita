import { CONTRACT_ITEM_STATE } from "$lib/contract_item_state"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"

export async function create_contract_item(contract_id: number) {
  await query_builder
    .insertInto("contract_item")
    .values({
      name: "",
      state: CONTRACT_ITEM_STATE.GOOD,
      contract_id,
      created_at: now,
      updated_at: now,
    })
    .execute()
}
