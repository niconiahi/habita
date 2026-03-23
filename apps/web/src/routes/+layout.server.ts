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
import { require_active_subscription } from "$lib/server/subscription"
import { SUBSCRIPTION_STATUS } from "$lib/subscription_status"
import type { LayoutServerLoad } from "./$types"

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/onboarding",
  "/subscribe",
  "/webhooks",
  "/health",
  "/api",
]

function is_public_route(pathname: string) {
  if (pathname === "/") return true
  return PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route),
  )
}

export const load: LayoutServerLoad = async ({
  locals,
  url,
}) => {
  let notifications: Notification[] = []
  let is_manager = false
  let organizations: SelectableOrganization[] = []
  let subscription_grace = false
  let subscription_days_remaining = 0

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

    if (!is_public_route(url.pathname)) {
      const subscription_check =
        require_active_subscription(
          locals.subscriptions,
          locals.session?.activeOrganizationId ?? null,
        )
      if (
        subscription_check.status ===
        SUBSCRIPTION_STATUS.GRACE
      ) {
        subscription_grace = true
        subscription_days_remaining =
          subscription_check.days_remaining
      }
    }
  }

  return {
    user: locals.user,
    notifications,
    is_manager,
    organizations,
    active_organization_id:
      locals.session?.activeOrganizationId ?? null,
    subscription_grace,
    subscription_days_remaining,
  }
}
