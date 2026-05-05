import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { now } from "$lib/server/now"
import { SERVICE_TYPE } from "$lib/service"
import { logger } from "$lib/telemetry/logger"

export async function create_service(property_id: number) {
  try {
    await query_builder
      .insertInto("service")
      .values({
        code: "",
        type: SERVICE_TYPE.MUNICIPAL_FEE,
        updated_at: now,
        created_at: now,
        property_id,
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
      message: "Error al crear el servicio",
    })
  }
}
