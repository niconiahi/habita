import { query_builder } from "db/query_builder"
import { safe_async } from "$lib/safe_async"
import { now } from "$lib/server/now"
import { SERVICE_TYPE } from "$lib/service"
import { logger } from "$lib/telemetry/logger"

export async function create_service(property_id: number) {
  const [error] = await safe_async(
    query_builder
      .insertInto("service")
      .values({
        code: "",
        type: SERVICE_TYPE.MUNICIPAL_FEE,
        updated_at: now,
        created_at: now,
        property_id,
      })
      .execute(),
  )
  if (error) {
    logger.error(error.message, { property_id }, error)
    return [
      {
        create_service: {
          execution: "Error al crear el servicio",
        },
      },
      null,
    ] as const
  }
  return [null, null] as const
}
