import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { PROPERTY_STATE } from "$lib/property_state"
import { safe_async } from "$lib/safe_async"
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
    logger.error(error.message, { property_id: input.property_id }, error)
    return [
      {
        publish_property: {
          execution: "Error al publicar la propiedad",
        },
      },
      null,
    ] as const
  }
  return [null, null] as const
}
