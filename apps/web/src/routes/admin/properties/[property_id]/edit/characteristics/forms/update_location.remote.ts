import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form, getRequestEvent } from "$app/server"
import { query_builder } from "db/query_builder"
import { LocationSchema } from "$lib/location"
import { RemoteNumberSchema } from "$lib/remote_number"
import { require_authentication } from "$lib/server/auth"
import { now } from "$lib/server/now"
import { compose_point } from "$lib/server/point"
import { require_edit_access } from "$lib/server/property_access"
import { logger } from "$lib/telemetry/logger"

export const update_location = form(
  v.object({
    property_id: RemoteNumberSchema,
    id: RemoteNumberSchema,
    location: v.pipe(
      v.string(),
      v.transform((val) => JSON.parse(val)),
      v.nonNullish(LocationSchema, "Debés buscar y seleccionar una ubicación"),
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
        .updateTable("location")
        .set({
          id: input.id,
          latitude: input.location.lat,
          longitude: input.location.lon,
          point: compose_point(
            input.location.lat,
            input.location.lon,
          ),
          house_number: Number(
            input.location.address.house_number,
          ),
          address: input.location.display_name,
          road: input.location.address.road,
          city: input.location.address.city,
          town: input.location.address.town,
          state: input.location.address.state,
          suburb: input.location.address.suburb,
          updated_at: now,
        })
        .where("location.id", "=", input.id)
        .execute()
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(err.message, { location_id: input.id }, err)
      else logger.unknown(err)
      error(500, "Error al actualizar la ubicación")
    }
  },
)
