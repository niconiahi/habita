import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { FLOOR_NUMBER } from "$lib/floor_number"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"

const FLOOR_NUMBERS_ASC = Object.values(FLOOR_NUMBER).sort(
  (a, b) => a - b,
)
const MIN_FLOOR = FLOOR_NUMBERS_ASC[0]
const MAX_FLOOR =
  FLOOR_NUMBERS_ASC[FLOOR_NUMBERS_ASC.length - 1]

export async function create_floor(
  property_id: number,
  direction: "up" | "down",
) {
  const floors = await query_builder
    .selectFrom("floor")
    .select("floor.number")
    .where("floor.property_id", "=", property_id)
    .execute()

  let next_number: number
  if (floors.length === 0) {
    next_number = FLOOR_NUMBER.GROUND
  } else if (direction === "up") {
    const max = Math.max(...floors.map((f) => f.number))
    next_number = max + 1
  } else {
    const min = Math.min(...floors.map((f) => f.number))
    next_number = min - 1
  }

  if (next_number > MAX_FLOOR || next_number < MIN_FLOOR) {
    return fail(400, {
      message: "No se pueden agregar más pisos",
    })
  }

  try {
    await query_builder
      .insertInto("floor")
      .values({
        property_id,
        number: next_number,
        created_at: now,
        updated_at: now,
      })
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { property_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al crear el piso",
    })
  }
}
