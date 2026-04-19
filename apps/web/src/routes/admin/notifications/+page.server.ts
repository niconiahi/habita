import { require_authentication } from "$lib/server/auth"
import { ACCESS_TYPE } from "$lib/access_type"
import { fetch_all_notifications } from "$lib/fetchers/notifications.server"
import { get_accessible_property_ids } from "$lib/server/property_access"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  locals,
}) => {
  require_authentication(locals)

  const property_ids = await get_accessible_property_ids(
    locals.user.id,
    [ACCESS_TYPE.MANAGER],
    locals.session.activeOrganizationId,
  )

  if (property_ids.length === 0) {
    return { notifications: [] }
  }

  const notifications =
    await fetch_all_notifications(property_ids)

  return { notifications }
}
