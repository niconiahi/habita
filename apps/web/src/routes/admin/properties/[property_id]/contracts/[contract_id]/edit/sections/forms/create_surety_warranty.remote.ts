import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { now } from "$lib/server/now"
import { require_contract_edit_access_remote } from "$lib/server/auth/require_contract_edit_access_remote"
import { logger } from "$lib/telemetry/logger"
import { WARRANTY_TYPE } from "$lib/warranty_type"

export const create_surety_warranty = form(
  v.object({
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
    guarantor_name: v.pipe(
      v.string("Nombre del garante es requerido"),
      v.minLength(1, "Nombre del garante es requerido"),
    ),
    guarantor_dni: v.pipe(
      v.string("DNI del garante es requerido"),
      v.minLength(1, "DNI del garante es requerido"),
    ),
    guarantor_email: v.pipe(
      v.string("Email del garante es requerido"),
      v.minLength(1, "Email del garante es requerido"),
    ),
    company_name: v.pipe(
      v.string("Nombre de la aseguradora es requerido"),
      v.minLength(1, "Nombre de la aseguradora es requerido"),
    ),
    policy_number: v.pipe(
      v.string("Número de póliza es requerido"),
      v.minLength(1, "Número de póliza es requerido"),
    ),
    company_email: v.pipe(
      v.string("Email de la aseguradora es requerido"),
      v.minLength(1, "Email de la aseguradora es requerido"),
    ),
  }),
  async (input) => {
    await require_contract_edit_access_remote(input)
    try {
      await query_builder.transaction().execute(async (tx) => {
        const warranty = await tx
          .insertInto("warranty")
          .values({
            type: WARRANTY_TYPE.SURETY,
            created_at: now,
            updated_at: now,
          })
          .returning("id")
          .executeTakeFirstOrThrow()
        await tx
          .insertInto("surety_warranty")
          .values({
            warranty_id: warranty.id,
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
