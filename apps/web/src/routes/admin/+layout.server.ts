import { is_realtor } from "$lib/server/organization"
import { require_authentication } from "$lib/server/auth"
import { is_webmaster } from "$lib/server/is_webmaster"
import { require_active_subscription } from "$lib/server/subscription"
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

  let is_realtor_user = false
  if (locals.user) {
    is_realtor_user = await is_realtor(locals.user.id)
  }
  return {
    is_realtor: is_realtor_user,
    is_webmaster: is_webmaster(locals.user),
  }
}
