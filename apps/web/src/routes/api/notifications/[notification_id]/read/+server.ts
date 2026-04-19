import { require_authentication } from "$lib/server/auth"
import { json, redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import { query_builder } from "db/query_builder"
import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async ({
  locals,
  params,
}) => {
  require_authentication(locals)

  const notification_id = v.parse(
    ForceNumberSchema,
    params.notification_id,
  )

  const [error] = await safe_async(
    query_builder
      .updateTable("notification")
      .set({ read_at: new Date() })
      .where("notification.id", "=", notification_id)
      .where("notification.read_at", "is", null)
      .execute(),
  )
  if (error) {
    logger.error(error.message, {}, error)
    return json(
      { error: "Error al marcar la notificación" },
      { status: 500 },
    )
  }

  return json({ ok: true })
}
