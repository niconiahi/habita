import { json, redirect } from "@sveltejs/kit"
import { ACCESS_TYPE } from "$lib/access_type"
import { fetch_notifications } from "$lib/fetchers/notifications.server"
import { get_accessible_property_ids } from "$lib/server/property_access"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({
  locals,
}) => {
  if (!locals.user) {
    redirect(302, "/login")
  }

  const property_ids = await get_accessible_property_ids(
    locals.user.id,
    [ACCESS_TYPE.MANAGER],
    locals.session?.activeOrganizationId,
  )

  if (property_ids.length === 0) {
    return json([])
  }

  const notifications =
    await fetch_notifications(property_ids)

  return json(notifications)
}
