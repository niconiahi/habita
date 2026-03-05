import { redirect } from "@sveltejs/kit"
import { get_property_types } from "$lib/property_type"
import { get_property_destinies } from "$lib/property_destiny"
import { create_property } from "./actions/create_property.server"
import { ACTION } from "./actions/action"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  return {
    property_types: get_property_types(),
    property_destinies: get_property_destinies(),
  }
}

export const actions: Actions = {
  [ACTION.CREATE_PROPERTY]: async ({ request, locals }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    const form_data = await request.formData()
    form_data.set("user_id", String(locals.user.id))
    if (locals.session?.activeOrganizationId) {
      form_data.set(
        "organization_id",
        locals.session.activeOrganizationId,
      )
    }
    const [create_property_errors, create_property_data] =
      await create_property(form_data)
    if (create_property_errors) {
      return { errors: create_property_errors }
    }
    redirect(303, create_property_data.redirect_to)
  },
}
