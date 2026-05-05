import { fail, redirect } from "@sveltejs/kit"
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
  candidate_id: ForceNumberSchema,
  property_id: ForceNumberSchema,
})

export async function set_tenant(form_data: FormData) {
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
      ACCESS_TYPE.TENANT,
    )
  } catch (error) {
    const typed_error =
      error instanceof Error
        ? error
        : new Error("unknown error")
    logger.error(
      typed_error.message,
      {
        property_id: input.property_id,
        candidate_id: input.candidate_id,
      },
      typed_error,
    )
    return fail(400, {
      message:
        "Error al revocar el acceso del inquilino",
    })
  }

  try {
    await assign_property_access(
      input.property_id,
      input.candidate_id,
      ACCESS_TYPE.TENANT,
    )
  } catch (error) {
    const typed_error =
      error instanceof Error
        ? error
        : new Error("unknown error")
    logger.error(
      typed_error.message,
      {
        property_id: input.property_id,
        candidate_id: input.candidate_id,
      },
      typed_error,
    )
    return fail(400, {
      message:
        "Error al asignar el acceso del inquilino",
    })
  }

  logger.info("tenant assigned to property", {
    property_id: input.property_id,
    candidate_id: input.candidate_id,
  })

  redirect(303, "/admin/candidates")
}
