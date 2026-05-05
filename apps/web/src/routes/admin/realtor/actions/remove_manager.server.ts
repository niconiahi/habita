import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
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
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  try {
    await query_builder.transaction().execute(async (tx) => {
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
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { manager_id: input.manager_id, organization_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al eliminar el manager",
    })
  }

  logger.info("manager removed from organization", {
    organization_id,
    manager_id: input.manager_id,
  })
}
