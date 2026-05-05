import { require_authentication } from "$lib/server/auth"
import { error } from "@sveltejs/kit"
import { get_user_realtor_organization } from "$lib/server/organization"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { invite_manager } from "./actions/invite_manager.server"
import { reassign_property } from "./actions/reassign_property.server"
import { remove_manager } from "./actions/remove_manager.server"
import { fetch_managers_with_property_counts } from "./fetchers/managers.server"
import { fetch_organization_details } from "./fetchers/organization.server"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)

  const realtor_org = await get_user_realtor_organization(
    locals.user.id,
  )
  if (!realtor_org) {
    error(403, "Not authorized - realtor access required")
  }

  const [organization, managers] = await Promise.all([
    fetch_organization_details(realtor_org.id),
    fetch_managers_with_property_counts(locals.user.id),
  ])

  return { organization, managers }
}

export const actions: Actions = {
  [ACTION.INVITE_MANAGER]: async ({ request, locals }) => {
    require_authentication(locals)
    const realtor_org = await get_user_realtor_organization(
      locals.user.id,
    )
    if (!realtor_org) error(403, "Forbidden")

    const form_data = await request.formData()
    return invite_manager(
      form_data,
      realtor_org.id,
      locals.user.id,
    )
  },

  [ACTION.REMOVE_MANAGER]: async ({ request, locals }) => {
    require_authentication(locals)
    const realtor_org = await get_user_realtor_organization(
      locals.user.id,
    )
    if (!realtor_org) error(403, "Forbidden")

    const form_data = await request.formData()
    return remove_manager(form_data, realtor_org.id)
  },

  [ACTION.REASSIGN_PROPERTY]: async ({
    request,
    locals,
  }) => {
    require_authentication(locals)
    const realtor_org = await get_user_realtor_organization(
      locals.user.id,
    )
    if (!realtor_org) error(403, "Forbidden")

    const form_data = await request.formData()
    return reassign_property(form_data)
  },
}
