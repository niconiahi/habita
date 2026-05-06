import { fail } from "@sveltejs/kit"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import {
  assign_property_access,
  revoke_all_access_by_type,
} from "$lib/server/property_access"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  property_id: ForceNumberSchema,
  new_manager_id: v.optional(ForceNumberSchema),
})

export async function reassign_property(
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
    await revoke_all_access_by_type(
      input.property_id,
      ACCESS_TYPE.MANAGER,
    )
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { property_id: input.property_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al revocar el acceso del gestor",
    })
  }

  if (input.new_manager_id) {
    try {
      await assign_property_access(
        input.property_id,
        input.new_manager_id,
        ACCESS_TYPE.MANAGER,
      )
    } catch (error) {
      if (error instanceof Error) {
        logger.error(
          error.message,
          {
            property_id: input.property_id,
            new_manager_id: input.new_manager_id,
          },
          error,
        )
      } else {
        logger.unknown(error)
      }
      return fail(400, {
        message: "Error al asignar el nuevo gestor",
      })
    }
  }

  logger.info("property reassigned", {
    property_id: input.property_id,
    new_manager_id: input.new_manager_id,
  })
}
