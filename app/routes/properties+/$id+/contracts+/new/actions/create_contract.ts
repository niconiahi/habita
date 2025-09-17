import { query_builder } from "db/query_builder"
import { now } from "~/lib/now"
import { ContractState } from "~/lib/server/contract_state"

export async function create_contract(property_id: number) {
  await query_builder
    .insertInto("contract")
    .values({
      property_id,
      created_at: now,
      updated_at: now,
      state: ContractState.INACTIVE,
    })
    .execute()
}
