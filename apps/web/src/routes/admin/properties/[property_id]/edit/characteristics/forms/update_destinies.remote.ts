import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form, getRequestEvent } from "$app/server"
import { query_builder } from "db/query_builder"
import { PropertyDestinySchema } from "$lib/property_destiny"
import { RemoteNumberSchema } from "$lib/remote_number"
import { require_authentication } from "$lib/server/auth"
import { now } from "$lib/server/now"
import { require_edit_access } from "$lib/server/property_access"
import { logger } from "$lib/telemetry/logger"

export const update_destinies = form(
  v.object({
    property_id: RemoteNumberSchema,
    destinies: v.pipe(
      v.optional(v.array(v.pipe(RemoteNumberSchema, PropertyDestinySchema)), []),
      v.minLength(1, "Seleccioná al menos un destino"),
    ),
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
        .updateTable("property")
        .set({
          destinies: input.destinies,
          updated_at: now,
        })
        .where("property.id", "=", input.property_id)
        .execute()
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          { property_id: input.property_id },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al actualizar los destinos")
    }
  },
)
