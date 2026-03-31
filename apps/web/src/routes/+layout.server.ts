import { ACCESS_TYPE } from "$lib/access_type"
import {
  get_user_selectable_organizations,
  type SelectableOrganization,
} from "$lib/server/organization"
import { get_accessible_property_ids } from "$lib/server/property_access"
import {
  get_grace_days_remaining,
  resolve_subscription_status,
} from "$lib/server/subscription"
import { SUBSCRIPTION_STATUS } from "$lib/subscription_status"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({
  locals,
}) => {
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
    organizations = await get_user_selectable_organizations(
      locals.user.id,
    )

    const active_organization_id =
      locals.session?.activeOrganizationId ?? null
    const subscription = locals.subscriptions.find(
      (s) => s.organization_id === active_organization_id,
    )
    if (subscription) {
      const status = resolve_subscription_status(
        new Date(subscription.ends_at),
      )
      if (status === SUBSCRIPTION_STATUS.GRACE) {
        subscription_grace = true
        subscription_days_remaining =
          get_grace_days_remaining(
            new Date(subscription.ends_at),
          )
      }
    }
  }

  return {
    user: locals.user,
    is_manager,
    organizations,
    active_organization_id:
      locals.session?.activeOrganizationId ?? null,
    subscription_grace,
    subscription_days_remaining,
  }
}
