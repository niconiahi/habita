import * as v from "valibot"
import { CONTRACT_STATE } from "$lib/contract_state"
import { ForceNumberSchema } from "$lib/force_number"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"

export async function create_contract(
  form_data: FormData,
  property_id: number,
) {
  const price = v.parse(
    ForceNumberSchema,
    form_data.get("price"),
  )
  const type = v.parse(
    ForceNumberSchema,
    form_data.get("type"),
  )
  const contract = await query_builder
    .transaction()
    .execute(async (tx) => {
      const contract = await tx
        .insertInto("contract")
        .values({
          property_id,
          created_at: now,
          updated_at: now,
          state: CONTRACT_STATE.EDITING,
          type,
        })
        .returning("id")
        .executeTakeFirstOrThrow()
      await tx
        .insertInto("period")
        .values({
          contract_id: contract.id,
          price: price,
          created_at: now,
          updated_at: now,
        })
        .returning("id")
        .executeTakeFirstOrThrow()
      return contract
    })
  return {
    redirect_to: `/admin/properties/${property_id}/contracts/${contract.id}/edit`,
  }
}
