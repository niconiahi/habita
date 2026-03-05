import { redirect, error } from "@sveltejs/kit"
import { get_user_realtor_organization } from "$lib/server/organization"
import { fetch_organization_details } from "./fetchers/organization.server"
import { fetch_managers_with_property_counts } from "./fetchers/managers.server"
import { invite_manager } from "./actions/invite_manager.server"
import { remove_manager } from "./actions/remove_manager.server"
import { reassign_property } from "./actions/reassign_property.server"
import { ACTION } from "./actions/action"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }

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
    if (!locals.user) redirect(302, "/auth/google")
    const realtor_org = await get_user_realtor_organization(
      locals.user.id,
    )
    if (!realtor_org) error(403, "Forbidden")

    const form_data = await request.formData()
    const [invite_manager_errors] = await invite_manager(
      form_data,
      realtor_org.id,
      locals.user.id,
    )
    if (invite_manager_errors) {
      return { errors: invite_manager_errors }
    }
    return null
  },

  [ACTION.REMOVE_MANAGER]: async ({ request, locals }) => {
    if (!locals.user) redirect(302, "/auth/google")
    const realtor_org = await get_user_realtor_organization(
      locals.user.id,
    )
    if (!realtor_org) error(403, "Forbidden")

    const form_data = await request.formData()
    const [remove_manager_errors] = await remove_manager(
      form_data,
      realtor_org.id,
    )
    if (remove_manager_errors) {
      return { errors: remove_manager_errors }
    }
    return null
  },

  [ACTION.REASSIGN_PROPERTY]: async ({
    request,
    locals,
  }) => {
    if (!locals.user) redirect(302, "/auth/google")
    const realtor_org = await get_user_realtor_organization(
      locals.user.id,
    )
    if (!realtor_org) error(403, "Forbidden")

    const form_data = await request.formData()
    const [reassign_property_errors] =
      await reassign_property(form_data)
    if (reassign_property_errors) {
      return { errors: reassign_property_errors }
    }
    return null
  },
}
