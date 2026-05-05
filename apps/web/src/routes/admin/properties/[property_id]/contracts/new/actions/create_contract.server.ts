import { fail, redirect } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { CONTRACT_STATE } from "$lib/contract_state"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  price: ForceNumberSchema,
  type: ForceNumberSchema,
})

export async function create_contract(
  form_data: FormData,
  property_id: number,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  let contract
  try {
    contract = await query_builder
      .transaction()
      .execute(async (tx) => {
        const contract = await tx
          .insertInto("contract")
          .values({
            property_id,
            created_at: now,
            updated_at: now,
            state: CONTRACT_STATE.EDITING,
            type: input.type,
          })
          .returning("id")
          .executeTakeFirstOrThrow()
        await tx
          .insertInto("period")
          .values({
            contract_id: contract.id,
            price: input.price,
            created_at: now,
            updated_at: now,
          })
          .returning("id")
          .executeTakeFirstOrThrow()
        return contract
      })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { property_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al crear el contrato",
    })
  }

  logger.info("contract created", {
    property_id,
    contract_id: contract.id,
  })

  redirect(
    303,
    `/admin/properties/${property_id}/contracts/${contract.id}/edit`,
  )
}
