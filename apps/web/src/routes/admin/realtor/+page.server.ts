import { redirect, error } from "@sveltejs/kit"
import { get_user_realtor_organization } from "$lib/server/organization"
import { fetch_organization_details } from "./fetchers/organization.server"
import { fetch_admins_with_property_counts } from "./fetchers/admins.server"
import { invite_admin } from "./actions/invite_admin.server"
import { remove_admin } from "./actions/remove_admin.server"
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

  const [organization, admins] = await Promise.all([
    fetch_organization_details(realtor_org.id),
    fetch_admins_with_property_counts(realtor_org.id),
  ])

  return { organization, admins }
}

export const actions: Actions = {
  [ACTION.INVITE_ADMIN]: async ({ request, locals }) => {
    if (!locals.user) redirect(302, "/auth/google")
    const realtor_org = await get_user_realtor_organization(
      locals.user.id,
    )
    if (!realtor_org) error(403, "Forbidden")

    const form_data = await request.formData()
    await invite_admin(
      form_data,
      realtor_org.id,
      locals.user.id,
    )
    return null
  },

  [ACTION.REMOVE_ADMIN]: async ({ request, locals }) => {
    if (!locals.user) redirect(302, "/auth/google")
    const realtor_org = await get_user_realtor_organization(
      locals.user.id,
    )
    if (!realtor_org) error(403, "Forbidden")

    const form_data = await request.formData()
    await remove_admin(form_data, realtor_org.id)
    return null
  },

  [ACTION.REASSIGN_PROPERTY]: async ({ request, locals }) => {
    if (!locals.user) redirect(302, "/auth/google")
    const realtor_org = await get_user_realtor_organization(
      locals.user.id,
    )
    if (!realtor_org) error(403, "Forbidden")

    const form_data = await request.formData()
    await reassign_property(form_data)
    return null
  },
}
