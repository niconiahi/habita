import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { now } from "~/lib/now"
import { CONTRACT_STATE } from "~/lib/server/contract_state"
import { ForceNumberSchema } from "~/lib/server/force_number"

export async function create_contract(
  form_data: FormData,
  property_id: number,
) {
  const price = v.parse(
    ForceNumberSchema,
    form_data.get("price"),
  )
  await query_builder.transaction().execute(async (tx) => {
    const contract = await tx
      .insertInto("contract")
      .values({
        property_id,
        created_at: now,
        updated_at: now,
        state: CONTRACT_STATE.INACTIVE,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
    await tx
      .insertInto("period")
      .values({
        contract_id: contract.id,
        price: price.toString(),
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
  })
}
