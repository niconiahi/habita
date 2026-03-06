import * as v from "valibot"
import { CONTRACT_STATE } from "$lib/contract_state"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import { query_builder } from "db/query_builder"

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
    return [
      {
        create_contract: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [error, contract] = await safe_async(
    query_builder
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
      }),
  )
  if (error) {
    logger.error(error.message, { property_id }, error)
    return [
      {
        create_contract: {
          execution:
            "Error al crear el contrato",
        },
      },
      null,
    ] as const
  }
  logger.info("contract created", {
    property_id,
    contract_id: contract.id,
  })

  return [
    null,
    {
      redirect_to: `/admin/properties/${property_id}/contracts/${contract.id}/edit`,
    },
  ] as const
}
