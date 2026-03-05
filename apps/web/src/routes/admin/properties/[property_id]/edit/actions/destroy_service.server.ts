import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  id: ForceNumberSchema,
})

export async function destroy_service(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        destroy_service: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [error] = await safe_async(
    query_builder
      .deleteFrom("service")
      .where("service.id", "=", input.id)
      .execute(),
  )
  if (error) {
    logger.error(error.message, { service_id: input.id }, error)
    return [
      {
        destroy_service: {
          execution: "Error al eliminar el servicio",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
