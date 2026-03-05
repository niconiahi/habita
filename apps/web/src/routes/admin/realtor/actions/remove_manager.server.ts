import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { query_builder } from "db/query_builder"
import { ACCESS_TYPE } from "$lib/access_type"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  manager_id: ForceNumberSchema,
})

export async function remove_manager(
  form_data: FormData,
  organization_id: string,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        remove_manager: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [transaction_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      await tx
        .deleteFrom("property_access")
        .where("user_id", "=", input.manager_id)
        .where("type", "=", ACCESS_TYPE.MANAGER)
        .execute()
      await tx
        .deleteFrom("member")
        .where("organization_id", "=", organization_id)
        .where("user_id", "=", input.manager_id)
        .where("role", "=", "manager")
        .execute()
    }),
  )
  if (transaction_error) {
    logger.error(transaction_error.message, { manager_id: input.manager_id, organization_id }, transaction_error)
    return [
      {
        remove_manager: {
          execution:
            "Error al eliminar el manager",
        },
      },
      null,
    ] as const
  }
  return [null, null] as const
}
