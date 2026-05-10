import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form, getRequestEvent } from "$app/server"
import { query_builder } from "db/query_builder"
import { PropertyTagTypeSchema } from "$lib/property_tag_type"
import { RemoteNumberSchema } from "$lib/remote_number"
import { require_authentication } from "$lib/server/auth"
import { now } from "$lib/server/now"
import { require_edit_access } from "$lib/server/property_access"
import { logger } from "$lib/telemetry/logger"

export const update_property_tags = form(
  v.object({
    property_id: RemoteNumberSchema,
    types: v.optional(v.array(v.pipe(RemoteNumberSchema, PropertyTagTypeSchema)), []),
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
    const desired = new Set<number>(input.types)
    try {
      await query_builder.transaction().execute(async (tx) => {
        const existing = await tx
          .selectFrom("property_tag")
          .where("property_id", "=", input.property_id)
          .select(["id", "type"])
          .execute()
        const current = new Set<number>(
          existing.map((row) => row.type),
        )
        const to_insert = input.types.filter(
          (type) => !current.has(type),
        )
        const to_delete_ids = existing
          .filter((row) => !desired.has(row.type))
          .map((row) => row.id)
        if (to_delete_ids.length > 0) {
          await tx
            .deleteFrom("property_tag")
            .where("id", "in", to_delete_ids)
            .execute()
        }
        if (to_insert.length > 0) {
          await tx
            .insertInto("property_tag")
            .values(
              to_insert.map((type) => ({
                property_id: input.property_id,
                type,
                created_at: now,
                updated_at: now,
              })),
            )
            .execute()
        }
      })
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          { property_id: input.property_id },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al actualizar los tags")
    }
  },
)
