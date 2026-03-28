import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { LocationSchema } from "$lib/location"
import { safe_async } from "$lib/safe_async"
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
    return [
      {
        update_location: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [error] = await safe_async(
    query_builder
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
      .execute(),
  )
  if (error) {
    logger.error(
      error.message,
      { location_id: input.id },
      error,
    )
    return [
      {
        update_location: {
          execution: "Error al actualizar la ubicación",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
