import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { now } from "$lib/server/now"
import { require_contract_edit_access_remote } from "$lib/server/auth/require_contract_edit_access_remote"
import { logger } from "$lib/telemetry/logger"
import { WARRANTY_TYPE } from "$lib/warranty_type"

export const update_surety_warranty = form(
  v.object({
    warranty_id: RemoteNumberSchema,
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
    guarantor_name: v.string(),
    guarantor_dni: v.string(),
    guarantor_email: v.string(),
    company_name: v.string(),
    policy_number: v.string(),
    company_email: v.string(),
  }),
  async (input) => {
    await require_contract_edit_access_remote(input)
    try {
      await query_builder.transaction().execute(async (tx) => {
        await tx
          .updateTable("warranty")
          .set({
            type: WARRANTY_TYPE.SURETY,
            updated_at: now,
          })
          .where("warranty.id", "=", input.warranty_id)
          .execute()
        const existing = await tx
          .selectFrom("surety_warranty")
          .select("id")
          .where(
            "surety_warranty.warranty_id",
            "=",
            input.warranty_id,
          )
          .executeTakeFirst()
        if (existing) {
          await tx
            .updateTable("surety_warranty")
            .set({
              guarantor_name: input.guarantor_name,
              guarantor_dni: input.guarantor_dni,
              guarantor_email: input.guarantor_email,
              company_name: input.company_name,
              policy_number: input.policy_number,
              company_email: input.company_email,
              updated_at: now,
            })
            .where("surety_warranty.id", "=", existing.id)
            .execute()
        } else {
          await tx
            .insertInto("surety_warranty")
            .values({
              warranty_id: input.warranty_id,
              guarantor_name: input.guarantor_name,
              guarantor_dni: input.guarantor_dni,
              guarantor_email: input.guarantor_email,
              company_name: input.company_name,
              policy_number: input.policy_number,
              company_email: input.company_email,
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
