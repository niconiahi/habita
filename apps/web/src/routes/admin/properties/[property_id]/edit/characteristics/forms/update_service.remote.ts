import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form, getRequestEvent } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { ServiceTypeSchema } from "$lib/service"
import { require_authentication } from "$lib/server/auth"
import { now } from "$lib/server/now"
import { require_edit_access } from "$lib/server/property_access"
import { logger } from "$lib/telemetry/logger"

export const update_service = form(
  v.object({
    property_id: RemoteNumberSchema,
    id: RemoteNumberSchema,
    code: v.pipe(v.string(), v.nonEmpty("Debés proporcionar el código de pago")),
    type: v.pipe(RemoteNumberSchema, ServiceTypeSchema),
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
        .updateTable("service")
        .set({
          property_id: input.property_id,
          updated_at: now,
          id: input.id,
          type: input.type,
          code: input.code,
        })
        .where("service.id", "=", input.id)
        .execute()
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          {
            property_id: input.property_id,
            service_id: input.id,
          },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al actualizar el servicio")
    }
  },
)
