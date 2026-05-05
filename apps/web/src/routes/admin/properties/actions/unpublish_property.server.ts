import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { PROPERTY_STATE } from "$lib/property_state"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  property_id: ForceNumberSchema,
})

export async function unpublish_property(
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
      .updateTable("property")
      .set({
        state: PROPERTY_STATE.EDITING,
        updated_at: now,
      })
      .where("property.id", "=", input.property_id)
      .execute()
  } catch (error) {
    const typed_error =
      error instanceof Error
        ? error
        : new Error("unknown error")
    logger.error(
      typed_error.message,
      { property_id: input.property_id },
      typed_error,
    )
    return fail(400, {
      message: "Error al despublicar la propiedad",
    })
  }
  logger.info("property unpublished", {
    property_id: input.property_id,
  })
}
