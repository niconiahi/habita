import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { now } from "$lib/server/now"
import { PropertyDestinySchema } from "$lib/property_destiny"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  destiny: v.array(PropertyDestinySchema),
})

export async function update_destinies(
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
        update_destinies: {
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
        destinies: input.destiny,
        updated_at: now,
      })
      .where("property.id", "=", property_id)
      .execute(),
  )
  if (error) {
    logger.error(error.message, { property_id }, error)
    return [
      {
        update_destinies: {
          execution: "Error al actualizar los destinos",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
