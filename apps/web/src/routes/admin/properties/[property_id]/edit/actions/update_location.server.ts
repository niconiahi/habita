import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { LocationSchema } from "$lib/location"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { compose_point } from "$lib/server/point"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  id: ForceNumberSchema,
  location: v.pipe(
    v.string("La ubicación es requerida"),
    v.transform((val) => JSON.parse(val)),
    LocationSchema,
  ),
})

export async function update_location(form_data: FormData) {
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
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { location_id: input.id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al actualizar la ubicación",
    })
  }
}
