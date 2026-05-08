import { require_authentication } from "$lib/server/auth"
import { get_property_destinies } from "$lib/property_destiny"
import { get_property_types } from "$lib/property_type"
import { SUBSCRIPTION_TYPE } from "$lib/subscription_type"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { create_property } from "./actions/create_property.server"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)
  return {
    property_types: get_property_types(),
    property_destinies: get_property_destinies(),
  }
}

export const actions: Actions = {
  [ACTION.CREATE_PROPERTY]: async ({ request, locals }) => {
    require_authentication(locals)
    const form_data = await request.formData()
    form_data.set("user_id", String(locals.user.id))
    if (locals.session.activeOrganizationId) {
      const active_subscription = locals.subscriptions.find(
        (s) =>
          s.organization_id ===
          locals.session?.activeOrganizationId,
      )
      if (
        active_subscription?.type !==
        SUBSCRIPTION_TYPE.FREELANCE
      ) {
        form_data.set(
          "organization_id",
          locals.session.activeOrganizationId,
        )
      }
    }
    return create_property(form_data)
  },
}
