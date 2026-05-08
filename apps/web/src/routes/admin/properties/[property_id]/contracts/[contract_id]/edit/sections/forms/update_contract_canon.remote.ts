import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { now } from "$lib/server/now"
import { require_contract_edit_access_remote } from "$lib/server/auth/require_contract_edit_access_remote"
import { logger } from "$lib/telemetry/logger"

export const update_contract_canon = form(
  v.object({
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
    escalation_type: RemoteNumberSchema,
    escalation_duration: v.string(),
  }),
  async (input) => {
    await require_contract_edit_access_remote(input)
    try {
      await query_builder
        .updateTable("contract")
        .set({
          escalation_type: input.escalation_type,
          escalation_duration: input.escalation_duration,
          updated_at: now,
        })
        .where("contract.id", "=", input.contract_id)
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
      error(500, "Error al actualizar el canon")
    }
  },
)
