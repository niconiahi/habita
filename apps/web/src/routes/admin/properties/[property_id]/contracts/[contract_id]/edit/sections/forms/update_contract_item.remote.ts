import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form } from "$app/server"
import { query_builder } from "db/query_builder"
import { ContractItemStateSchema } from "$lib/contract_item_state"
import { RemoteNumberSchema } from "$lib/remote_number"
import { now } from "$lib/server/now"
import { require_contract_edit_access_remote } from "$lib/server/auth/require_contract_edit_access_remote"
import { logger } from "$lib/telemetry/logger"

export const update_contract_item = form(
  v.object({
    id: RemoteNumberSchema,
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
    name: v.pipe(
      v.string(),
      v.minLength(1, "El nombre es requerido"),
    ),
    state: v.pipe(
      v.string(),
      v.transform(Number),
      ContractItemStateSchema,
    ),
  }),
  async (input) => {
    await require_contract_edit_access_remote(input)
    try {
      await query_builder
        .updateTable("contract_item")
        .set({
          name: input.name,
          state: input.state,
          updated_at: now,
        })
        .where("contract_item.id", "=", input.id)
        .execute()
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          { contract_item_id: input.id },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al actualizar el ítem del contrato")
    }
  },
)
