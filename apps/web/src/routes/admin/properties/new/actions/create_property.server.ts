import { fail, redirect } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import { LocationSchema } from "$lib/location"
import { PropertyDestinySchema } from "$lib/property_destiny"
import { PROPERTY_STATE } from "$lib/property_state"
import {
  PROPERTY_TYPE,
  PropertyTypeSchema,
} from "$lib/property_type"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { compose_point } from "$lib/server/point"
import { assign_property_access } from "$lib/server/property_access"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  location: v.pipe(
    v.string("La ubicación es requerida"),
    v.transform((val) => JSON.parse(val)),
    LocationSchema,
  ),
  type: v.pipe(ForceNumberSchema, PropertyTypeSchema),
  destiny: v.array(
    v.pipe(ForceNumberSchema, PropertyDestinySchema),
  ),
  user_id: ForceNumberSchema,
  organization_id: v.nullish(v.pipe(v.string(), v.uuid())),
  unit: v.optional(v.string()),
})

export async function create_property(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

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
            house_number:
              input.location.address.house_number,
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
            realtor_id: input.organization_id ?? null,
            created_at: now,
            updated_at: now,
            location_id: location.id,
          })
          .returning("property.id")
          .executeTakeFirstOrThrow()
        return { id: property.id }
      })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        {
          user_id: input.user_id,
          organization_id: input.organization_id,
        },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al crear la propiedad",
    })
  }

  try {
    await assign_property_access(
      property.id,
      input.user_id,
      ACCESS_TYPE.MANAGER,
    )
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { property_id: property.id, user_id: input.user_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al asignar acceso a la propiedad",
    })
  }

  logger.info("property created", {
    property_id: property.id,
    user_id: input.user_id,
  })

  redirect(
    303,
    `/admin/properties/${property.id}/edit/characteristics`,
  )
}
