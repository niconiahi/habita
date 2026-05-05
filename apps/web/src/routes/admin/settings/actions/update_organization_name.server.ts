import { fail } from "@sveltejs/kit"
import * as v from "valibot"
import { auth } from "$lib/server/auth"
import { normalize_input } from "$lib/server/form"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
})

export async function update_organization_name(
  form_data: FormData,
  organization_id: string,
  request_headers: Headers,
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

  try {
    await auth.api.updateOrganization({
      body: {
        organizationId: organization_id,
        data: { name: input_validation.output.name },
      },
      headers: request_headers,
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { organization_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message:
        "Error al actualizar el nombre de la organización",
    })
  }
}
