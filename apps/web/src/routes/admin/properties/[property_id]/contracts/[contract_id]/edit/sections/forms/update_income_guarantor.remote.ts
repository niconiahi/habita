import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { now } from "$lib/server/now"
import { require_contract_edit_access_remote } from "$lib/server/auth/require_contract_edit_access_remote"
import { logger } from "$lib/telemetry/logger"

export const update_income_guarantor = form(
  v.object({
    id: RemoteNumberSchema,
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
    guarantor_name: v.string(),
    guarantor_dni: v.string(),
    guarantor_email: v.string(),
  }),
  async (input) => {
    await require_contract_edit_access_remote(input)
    try {
      await query_builder
        .updateTable("income_warranty_guarantor")
        .set({
          guarantor_name: input.guarantor_name,
          guarantor_dni: input.guarantor_dni,
          guarantor_email: input.guarantor_email,
          updated_at: now,
        })
        .where("income_warranty_guarantor.id", "=", input.id)
        .execute()
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          {
            guarantor_id: input.id,
            guarantor_dni: input.guarantor_dni,
          },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al actualizar el garante")
    }
  },
)
