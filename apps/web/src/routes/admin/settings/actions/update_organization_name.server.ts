import * as v from "valibot"
import { safe_async } from "$lib/safe_async"
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
  const input = normalize_input(form_data, InputSchema)
  const result = v.safeParse(InputSchema, input)
  if (!result.success) {
    return [
      {
        update_organization_name: {
          input: v.flatten(result.issues),
        },
      },
      null,
    ] as const
  }

  const [update_error] = await safe_async(
    auth.api.updateOrganization({
      body: {
        organizationId: organization_id,
        data: { name: result.output.name },
      },
      headers: request_headers,
    }),
  )
  if (update_error) {
    console.error("UPDATE ORG ERROR:", update_error)
    logger.error(
      "failed to update organization name",
      { organization_id },
      update_error,
    )
    return [
      {
        update_organization_name: {
          execution:
            "Error al actualizar el nombre de la organización",
        },
      },
      null,
    ] as const
  }

  return [null, { success: true }] as const
}
