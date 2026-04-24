import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { normalize_input } from "$lib/server/form"
import { SLOT_STATE } from "$lib/slot_state"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  id: ForceNumberSchema,
})

export async function destroy_slot(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        destroy_slot: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [error] = await safe_async(
    query_builder
      .deleteFrom("slot")
      .where("slot.id", "=", input.id)
      .where("slot.state", "=", SLOT_STATE.FREE)
      .execute(),
  )
  if (error) {
    logger.error(
      error.message,
      { slot_id: input.id },
      error,
    )
    return [
      {
        destroy_slot: {
          execution: "Error al eliminar el turno",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
