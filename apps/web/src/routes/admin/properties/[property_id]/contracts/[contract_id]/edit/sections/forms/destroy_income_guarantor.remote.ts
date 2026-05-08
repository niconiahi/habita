import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { require_contract_edit_access_remote } from "$lib/server/auth/require_contract_edit_access_remote"
import { logger } from "$lib/telemetry/logger"

export const destroy_income_guarantor = form(
  v.object({
    id: RemoteNumberSchema,
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
  }),
  async (input) => {
    await require_contract_edit_access_remote(input)
    try {
      await query_builder
        .deleteFrom("income_warranty_guarantor")
        .where("income_warranty_guarantor.id", "=", input.id)
        .execute()
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          { guarantor_id: input.id },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al eliminar el garante")
    }
  },
)
