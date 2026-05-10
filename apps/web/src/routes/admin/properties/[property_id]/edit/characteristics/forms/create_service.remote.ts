import * as v from "valibot"
import { error, fail } from "@sveltejs/kit"
import { form, getRequestEvent } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { SERVICE_TYPE } from "$lib/service"
import { require_authentication } from "$lib/server/auth"
import { now } from "$lib/server/now"
import { require_edit_access } from "$lib/server/property_access"
import { logger } from "$lib/telemetry/logger"

export const create_service = form(
  v.object({ property_id: RemoteNumberSchema }),
  async (input) => {
    const { request, locals } = getRequestEvent()
    require_authentication(locals)
    console.log('locals', locals)
    await require_edit_access(
      request.headers,
      locals.user.id,
      input.property_id,
      locals.session.activeOrganizationId,
    )
    try {
      const used_rows = await query_builder
        .selectFrom("service")
        .select("type")
        .where("property_id", "=", input.property_id)
        .execute()
      const used = new Set(used_rows.map((row) => row.type))
      const next_type = Object.values(SERVICE_TYPE).find(
        (type) => !used.has(type),
      )
      if (next_type === undefined) {
        return fail(400, {
          message: "Ya existen servicios de todos los tipos",
        })
      }
      await query_builder
        .insertInto("service")
        .values({
          code: "",
          type: next_type,
          updated_at: now,
          created_at: now,
          property_id: input.property_id,
        })
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
      error(500, "Error al crear el servicio")
    }
  },
)
