import { require_authentication } from "$lib/server/auth"
import { is_webmaster } from "$lib/server/is_webmaster"
import { require_active_subscription } from "$lib/server/subscription"
import { SUBSCRIPTION_TYPE } from "$lib/subscription_type"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)
  require_active_subscription(
    locals.subscriptions,
    locals.session.activeOrganizationId,
  )

  const active_subscription = locals.subscriptions.find(
    (s) =>
      s.organization_id ===
      locals.session.activeOrganizationId,
  )

  return {
    is_realtor:
      active_subscription?.type ===
      SUBSCRIPTION_TYPE.REALTOR,
    is_webmaster: is_webmaster(locals.user),
  }
}
