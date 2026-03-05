import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import { ACCESS_TYPE } from "$lib/access_type"
import {
  assign_property_access,
  revoke_all_access_by_type,
} from "$lib/server/property_access"

const InputSchema = v.object({
  candidate_id: ForceNumberSchema,
  property_id: ForceNumberSchema,
})

export async function set_tenant(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        set_tenant: {
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
      ACCESS_TYPE.TENANT,
    ),
  )
  if (revoke_error) {
    logger.error(revoke_error.message, { property_id: input.property_id, candidate_id: input.candidate_id }, revoke_error)
    return [
      {
        set_tenant: {
          execution:
            "Error al revocar el acceso del inquilino",
        },
      },
      null,
    ] as const
  }

  const [assign_error] = await safe_async(
    assign_property_access(
      input.property_id,
      input.candidate_id,
      ACCESS_TYPE.TENANT,
    ),
  )
  if (assign_error) {
    logger.error(assign_error.message, { property_id: input.property_id, candidate_id: input.candidate_id }, assign_error)
    return [
      {
        set_tenant: {
          execution:
            "Error al asignar el acceso del inquilino",
        },
      },
      null,
    ] as const
  }

  return [
    null,
    { redirect_to: "/admin/candidates" },
  ] as const
}
