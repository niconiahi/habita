import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form, getRequestEvent } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { require_authentication } from "$lib/server/auth"
import { now } from "$lib/server/now"
import { require_edit_access } from "$lib/server/property_access"
import { logger } from "$lib/telemetry/logger"

export const update_construction_year = form(
  v.object({
    property_id: RemoteNumberSchema,
    construction_year: v.optional(RemoteNumberSchema),
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
          construction_year: input.construction_year ?? null,
          updated_at: now,
        })
        .where("property.id", "=", input.property_id)
        .execute()
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          {
            property_id: input.property_id,
            construction_year: input.construction_year,
          },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al actualizar el año de construcción")
    }
  },
)
