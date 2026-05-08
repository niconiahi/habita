import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form } from "$app/server"
import { query_builder } from "db/query_builder"
import { CONTRACT_ITEM_STATE } from "$lib/contract_item_state"
import { RemoteNumberSchema } from "$lib/remote_number"
import { now } from "$lib/server/now"
import { require_contract_edit_access_remote } from "$lib/server/auth/require_contract_edit_access_remote"
import { logger } from "$lib/telemetry/logger"

export const create_contract_item = form(
  v.object({
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
  }),
  async (input) => {
    await require_contract_edit_access_remote(input)
    try {
      await query_builder
        .insertInto("contract_item")
        .values({
          name: "",
          state: CONTRACT_ITEM_STATE.GOOD,
          contract_id: input.contract_id,
          created_at: now,
          updated_at: now,
        })
        .execute()
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          { contract_id: input.contract_id },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al crear el ítem del contrato")
    }
  },
)
