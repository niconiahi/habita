import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { normalize_input } from "$lib/server/form"
import {
  assign_property_access,
  revoke_all_access_by_type,
} from "$lib/server/property_access"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  property_id: ForceNumberSchema,
  manager_id: v.optional(ForceNumberSchema),
})

export async function reassign_property(
  form_data: FormData,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        reassign_property: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [revoke_error] = await safe_async(
    revoke_all_access_by_type(
      input.property_id,
      ACCESS_TYPE.MANAGER,
    ),
  )
  if (revoke_error) {
    logger.error(
      revoke_error.message,
      { property_id: input.property_id },
      revoke_error,
    )
    return [
      {
        reassign_property: {
          execution:
            "Error al revocar el acceso del gestor",
        },
      },
      null,
    ] as const
  }

  if (input.manager_id) {
    const [assign_error] = await safe_async(
      assign_property_access(
        input.property_id,
        input.manager_id,
        ACCESS_TYPE.MANAGER,
      ),
    )
    if (assign_error) {
      logger.error(
        assign_error.message,
        {
          property_id: input.property_id,
          manager_id: input.manager_id,
        },
        assign_error,
      )
      return [
        {
          reassign_property: {
            execution:
              "Error al asignar el acceso del gestor",
          },
        },
        null,
      ] as const
    }
  }

  logger.info("property reassigned", {
    property_id: input.property_id,
    new_manager_id: input.manager_id,
  })

  return [
    null,
    {
      property_id: input.property_id,
      manager_id: input.manager_id,
    },
  ] as const
}
