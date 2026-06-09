import * as v from "valibot"
import { error, redirect } from "@sveltejs/kit"
import { form, getRequestEvent } from "$app/server"
import { query_builder } from "db/query_builder"
import { ACCESS_TYPE } from "$lib/access_type"
import { LocationSchema } from "$lib/location"
import { PropertyDestinySchema } from "$lib/property_destiny"
import { PROPERTY_STATE } from "$lib/property_state"
import {
  PROPERTY_TYPE,
  PropertyTypeSchema,
} from "$lib/property_type"
import { RemoteNumberSchema } from "$lib/remote_number"
import { require_authentication } from "$lib/server/auth"
import { now } from "$lib/server/now"
import { compose_point } from "$lib/server/point"
import { assign_property_access } from "$lib/server/property_access"
import { SUBSCRIPTION_TYPE } from "$lib/subscription_type"
import { logger } from "$lib/telemetry/logger"

export const create_property = form(
  v.object({
    location: v.pipe(
      v.string(),
      v.transform((val) => JSON.parse(val)),
      v.nonNullish(
        LocationSchema,
        "Debés buscar y seleccionar una ubicación",
      ),
    ),
    type: v.pipe(RemoteNumberSchema, PropertyTypeSchema),
    destiny: v.pipe(
      v.optional(
        v.array(
          v.pipe(RemoteNumberSchema, PropertyDestinySchema),
        ),
        [],
      ),
      v.minLength(1, "Seleccioná al menos un destino"),
    ),
    unit: v.optional(v.string()),
  }),
  async (input) => {
    const { locals } = getRequestEvent()
    require_authentication(locals)
    const user_id = locals.user.id
    const active_organization_id =
      locals.session.activeOrganizationId
    const active_subscription = active_organization_id
      ? locals.subscriptions.find(
          (s) => s.organization_id === active_organization_id,
        )
      : null
    const realtor_id =
      active_organization_id &&
      active_subscription?.type !== SUBSCRIPTION_TYPE.FREELANCE
        ? active_organization_id
        : null
    const unit =
      input.type === PROPERTY_TYPE.DEPARTMENT
        ? (input.unit?.toUpperCase() ?? null)
        : null

    let property
    try {
      property = await query_builder
        .transaction()
        .execute(async (tx) => {
          const location = await tx
            .insertInto("location")
            .values({
              latitude: input.location.lat,
              longitude: input.location.lon,
              road: input.location.address.road,
              house_number: input.location.address.house_number,
              suburb: input.location.address.suburb,
              town: input.location.address.town,
              city: input.location.address.city,
              state: input.location.address.state,
              point: compose_point(
                input.location.lat,
                input.location.lon,
              ),
              address: input.location.display_name,
              created_at: now,
              updated_at: now,
            })
            .returning("id")
            .executeTakeFirstOrThrow()
          const property = await tx
            .insertInto("property")
            .values({
              type: input.type,
              unit,
              destinies: input.destiny,
              state: PROPERTY_STATE.EDITING,
              realtor_id,
              created_at: now,
              updated_at: now,
              location_id: location.id,
            })
            .returning("property.id")
            .executeTakeFirstOrThrow()
          return { id: property.id }
        })
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          {
            user_id,
            organization_id: active_organization_id,
          },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al crear la propiedad")
    }

    try {
      await assign_property_access(
        property.id,
        user_id,
        ACCESS_TYPE.MANAGER,
      )
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          { property_id: property.id, user_id },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al asignar acceso a la propiedad")
    }

    logger.info("property created", {
      property_id: property.id,
      user_id,
    })

    redirect(
      303,
      `/admin/properties/${property.id}/edit/characteristics`,
    )
  },
)
