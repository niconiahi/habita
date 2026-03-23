import { is_realtor } from "$lib/server/organization"
import { require_active_subscription } from "$lib/server/subscription"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({
  locals,
}) => {
  require_active_subscription(
    locals.subscriptions,
    locals.session?.activeOrganizationId ?? null,
  )

  let is_realtor_user = false
  if (locals.user) {
    is_realtor_user = await is_realtor(locals.user.id)
  }
  return { is_realtor: is_realtor_user }
}
