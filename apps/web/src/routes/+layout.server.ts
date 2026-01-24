import { get_admin_property_ids } from "$lib/server/organization"
import {
  fetch_notifications,
  type Notification,
} from "$lib/fetchers/notifications.server"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({
  locals,
}) => {
  let notifications: Notification[] = []
  let is_administrator = false
  if (locals.user) {
    const admin_property_ids = await get_admin_property_ids(
      locals.user.id,
    )
    is_administrator = admin_property_ids.length > 0
    if (is_administrator) {
      notifications = await fetch_notifications(
        admin_property_ids,
      )
    }
  }
  return {
    user: locals.user,
    notifications,
    is_administrator,
  }
}
