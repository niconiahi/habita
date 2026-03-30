import { query_builder } from "db/query_builder"
import { FLOOR_NUMBER } from "$lib/floor_number"
import { safe_async } from "$lib/safe_async"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"

export async function create_floor(property_id: number) {
  const [error] = await safe_async(
    query_builder
      .insertInto("floor")
      .values({
        property_id,
        number: FLOOR_NUMBER.GROUND,
        created_at: now,
        updated_at: now,
      })
      .execute(),
  )
  if (error) {
    logger.error(error.message, { property_id }, error)
    return [
      {
        create_floor: {
          execution: "Error al crear el piso",
        },
      },
      null,
    ] as const
  }
  return [null, null] as const
}
