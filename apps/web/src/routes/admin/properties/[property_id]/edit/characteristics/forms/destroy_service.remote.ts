import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form, getRequestEvent } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { require_authentication } from "$lib/server/auth"
import { require_edit_access } from "$lib/server/property_access"
import { logger } from "$lib/telemetry/logger"

export const destroy_service = form(
  v.object({
    property_id: RemoteNumberSchema,
    id: RemoteNumberSchema,
  }),
  async (input) => {
    const { request, locals } = getRequestEvent()
    require_authentication(locals)
    await require_edit_access(
      request.headers,
      locals.user.id,
      input.property_id,
      locals.session.activeOrganizationId,
    )
    try {
      await query_builder
        .deleteFrom("service")
        .where("service.id", "=", input.id)
        .execute()
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          { service_id: input.id },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al eliminar el servicio")
    }
  },
)
