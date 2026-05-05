import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { fail } from "@sveltejs/kit"
import { ContractItemStateSchema } from "$lib/contract_item_state"
import { ForceNumberSchema } from "$lib/force_number"
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
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  try {
    await query_builder
      .updateTable("contract_item")
      .set({
        name: input.name,
        state: input.state,
        updated_at: now,
      })
      .where("contract_item.id", "=", input.id)
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { contract_item_id: input.id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al actualizar el ítem del contrato",
    })
  }
}
