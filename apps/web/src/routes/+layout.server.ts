import { ACCESS_TYPE } from "$lib/access_type"
import {
  fetch_notifications,
  type Notification,
} from "$lib/fetchers/notifications.server"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({
  locals,
}) => {
  let notifications: Notification[] = []

  if (locals.user) {
    const admin_property_ids = locals.user.accesses
      .filter(
        (access) => access.type === ACCESS_TYPE.ADMINISTRATOR,
      )
      .map((access) => access.property_id)

    if (admin_property_ids.length > 0) {
      notifications = await fetch_notifications(
        admin_property_ids,
      )
    }
  }

  return {
    user: locals.user,
    notifications,
  }
}
