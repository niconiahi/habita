import { query_builder } from "db/query_builder"
import { fail } from "@sveltejs/kit"
import { CONTRACT_ITEM_STATE } from "$lib/contract_item_state"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"

export async function create_contract_item(
  contract_id: number,
) {
  try {
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
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, { contract_id }, error)
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al crear el ítem del contrato",
    })
  }
}
