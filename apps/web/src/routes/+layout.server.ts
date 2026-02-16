import { ACCESS_TYPE } from "$lib/access_type"
import { get_accessible_property_ids } from "$lib/server/property_access"
import {
  get_user_selectable_organizations,
  type SelectableOrganization,
} from "$lib/server/organization"
import {
  fetch_notifications,
  type Notification,
} from "$lib/fetchers/notifications.server"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({
  locals,
}) => {
  let notifications: Notification[] = []
  let is_manager = false
  let organizations: SelectableOrganization[] = []
  if (locals.user) {
    const manager_property_ids =
      await get_accessible_property_ids(
        locals.user.id,
        [ACCESS_TYPE.MANAGER],
        locals.session?.activeOrganizationId,
      )
    is_manager = manager_property_ids.length > 0
    if (is_manager) {
      notifications = await fetch_notifications(
        manager_property_ids,
      )
    }
    organizations = await get_user_selectable_organizations(
      locals.user.id,
    )
  }
  return {
    user: locals.user,
    notifications,
    is_manager,
    organizations,
    active_organization_id:
      locals.session?.activeOrganizationId ?? null,
  }
}
