import { CONTRACT_ITEM_STATE } from "$lib/contract_item_state"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

export async function create_contract_item(
  contract_id: number,
) {
  const [error] = await safe_async(
    query_builder
      .insertInto("contract_item")
      .values({
        name: "",
        state: CONTRACT_ITEM_STATE.GOOD,
        contract_id,
        created_at: now,
        updated_at: now,
      })
      .execute(),
  )
  if (error) {
    logger.error(error.message, { contract_id }, error)
    return [
      {
        create_contract_item: {
          execution:
            "Error al crear el ítem del contrato",
        },
      },
      null,
    ] as const
  }
  return [null, null] as const
}
