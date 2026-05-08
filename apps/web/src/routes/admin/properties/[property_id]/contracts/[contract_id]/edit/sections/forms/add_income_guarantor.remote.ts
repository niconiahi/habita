import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { now } from "$lib/server/now"
import { require_contract_edit_access_remote } from "$lib/server/auth/require_contract_edit_access_remote"
import { logger } from "$lib/telemetry/logger"

export const add_income_guarantor = form(
  v.object({
    warranty_id: RemoteNumberSchema,
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
    guarantor_name: v.string(),
    guarantor_dni: v.string(),
    guarantor_email: v.string(),
  }),
  async (input) => {
    await require_contract_edit_access_remote(input)
    try {
      await query_builder.transaction().execute(async (tx) => {
        const income_warranty = await tx
          .selectFrom("income_warranty")
          .select("id")
          .where(
            "income_warranty.warranty_id",
            "=",
            input.warranty_id,
          )
          .executeTakeFirstOrThrow()
        await tx
          .insertInto("income_warranty_guarantor")
          .values({
            income_warranty_id: income_warranty.id,
            guarantor_name: input.guarantor_name,
            guarantor_dni: input.guarantor_dni,
            guarantor_email: input.guarantor_email,
            created_at: now,
            updated_at: now,
          })
          .execute()
      })
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          {
            warranty_id: input.warranty_id,
            guarantor_dni: input.guarantor_dni,
          },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al agregar el garante")
    }
  },
)
