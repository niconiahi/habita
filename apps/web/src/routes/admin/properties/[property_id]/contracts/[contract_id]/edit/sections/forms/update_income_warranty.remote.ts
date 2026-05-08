import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { now } from "$lib/server/now"
import { require_contract_edit_access_remote } from "$lib/server/auth/require_contract_edit_access_remote"
import { logger } from "$lib/telemetry/logger"
import { WARRANTY_TYPE } from "$lib/warranty_type"

export const update_income_warranty = form(
  v.object({
    warranty_id: RemoteNumberSchema,
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
  }),
  async (input) => {
    await require_contract_edit_access_remote(input)
    try {
      await query_builder.transaction().execute(async (tx) => {
        await tx
          .updateTable("warranty")
          .set({
            type: WARRANTY_TYPE.INCOME,
            updated_at: now,
          })
          .where("warranty.id", "=", input.warranty_id)
          .execute()
        const existing = await tx
          .selectFrom("income_warranty")
          .select("id")
          .where(
            "income_warranty.warranty_id",
            "=",
            input.warranty_id,
          )
          .executeTakeFirst()
        if (!existing) {
          await tx
            .insertInto("income_warranty")
            .values({
              warranty_id: input.warranty_id,
              created_at: now,
              updated_at: now,
            })
            .execute()
        }
      })
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          { warranty_id: input.warranty_id },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al actualizar la garantía")
    }
  },
)
