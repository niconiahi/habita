import { redirect, error } from "@sveltejs/kit"
import { ACCESS_TYPE } from "$lib/access_type"
import { has_edit_access } from "$lib/server/property_access"
import { fetch_properties } from "./fetchers/properties.server"
import { publish_property } from "./actions/publish_property.server"
import { unpublish_property } from "./actions/unpublish_property.server"
import { ACTION } from "./actions/action"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  const property_ids = locals.user.accesses
    .filter(
      (access) =>
        access.type === ACCESS_TYPE.OWNER ||
        access.type === ACCESS_TYPE.ADMINISTRATOR,
    )
    .map((access) => access.property_id)
  const properties = await fetch_properties(property_ids)
  return { properties }
}

export const actions: Actions = {
  [ACTION.PUBLISH_PROPERTY]: async ({ request, locals }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const form_data = await request.formData()
    await publish_property(form_data)
    return null
  },
  [ACTION.UNPUBLISH_PROPERTY]: async ({ request, locals }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const form_data = await request.formData()
    await unpublish_property(form_data)
    return null
  },
}
