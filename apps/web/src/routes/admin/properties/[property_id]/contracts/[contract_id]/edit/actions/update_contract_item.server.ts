import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ContractItemStateSchema } from "$lib/contract_item_state"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  id: ForceNumberSchema,
  name: v.pipe(
    v.string(),
    v.minLength(1, "El nombre es requerido"),
  ),
  state: v.pipe(
    v.string(),
    v.transform(Number),
    ContractItemStateSchema,
  ),
})

export async function update_contract_item(
  form_data: FormData,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        update_contract_item: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [error] = await safe_async(
    query_builder
      .updateTable("contract_item")
      .set({
        name: input.name,
        state: input.state,
        updated_at: now,
      })
      .where("contract_item.id", "=", input.id)
      .execute(),
  )
  if (error) {
    logger.error(
      error.message,
      { contract_item_id: input.id },
      error,
    )
    return [
      {
        update_contract_item: {
          execution:
            "Error al actualizar el ítem del contrato",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
