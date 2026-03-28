import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { ServiceTypeSchema } from "$lib/service"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  id: ForceNumberSchema,
  code: v.string(),
  type: v.pipe(
    v.string(),
    v.transform(Number),
    ServiceTypeSchema,
  ),
})

export async function update_service(
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
        update_service: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [error] = await safe_async(
    query_builder
      .updateTable("service")
      .set({
        property_id,
        updated_at: now,
        id: input.id,
        type: input.type,
        code: input.code,
      })
      .where("service.id", "=", input.id)
      .execute(),
  )
  if (error) {
    logger.error(
      error.message,
      { property_id, service_id: input.id },
      error,
    )
    return [
      {
        update_service: {
          execution: "Error al actualizar el servicio",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
