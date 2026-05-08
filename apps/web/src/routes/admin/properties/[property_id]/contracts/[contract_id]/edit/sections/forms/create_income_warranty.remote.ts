import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { now } from "$lib/server/now"
import { require_contract_edit_access_remote } from "$lib/server/auth/require_contract_edit_access_remote"
import { logger } from "$lib/telemetry/logger"
import { WARRANTY_TYPE } from "$lib/warranty_type"

export const create_income_warranty = form(
  v.object({
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
  }),
  async (input) => {
    await require_contract_edit_access_remote(input)
    try {
      await query_builder.transaction().execute(async (tx) => {
        const warranty = await tx
          .insertInto("warranty")
          .values({
            type: WARRANTY_TYPE.INCOME,
            created_at: now,
            updated_at: now,
          })
          .returning("id")
          .executeTakeFirstOrThrow()
        await tx
          .insertInto("income_warranty")
          .values({
            warranty_id: warranty.id,
            created_at: now,
            updated_at: now,
          })
          .execute()
        await tx
          .updateTable("contract")
          .set({
            warranty_id: warranty.id,
            updated_at: now,
          })
          .where("contract.id", "=", input.contract_id)
          .execute()
      })
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          { contract_id: input.contract_id },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al crear la garantía")
    }
  },
)
