import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { PROPERTY_STATE } from "$lib/property_state"
import { safe_async } from "$lib/safe_async"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  property_id: ForceNumberSchema,
})

export async function publish_property(
  form_data: FormData,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        publish_property: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [error] = await safe_async(
    query_builder
      .updateTable("property")
      .set({
        state: PROPERTY_STATE.PUBLISHED,
        updated_at: now,
      })
      .where("property.id", "=", input.property_id)
      .execute(),
  )
  if (error) {
    logger.error(
      error.message,
      { property_id: input.property_id },
      error,
    )
    return [
      {
        publish_property: {
          execution: "Error al publicar la propiedad",
        },
      },
      null,
    ] as const
  }
  logger.info("property published", {
    property_id: input.property_id,
  })

  return [null, null] as const
}
