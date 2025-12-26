import { redirect, error } from "@sveltejs/kit"
import { get_property_types } from "$lib/property_type"
import { get_property_destinies } from "$lib/property_destiny"
import { has_edit_access } from "$lib/server/property_access"
import { create_property } from "./actions/create_property.server"
import { ACTION } from "./actions/action"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  if (!has_edit_access(locals.user.accesses)) {
    error(400, "not found")
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
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const form_data = await request.formData()
    form_data.set("user_id", String(locals.user.id))
    const { redirect_to } = await create_property(form_data)
    redirect(303, redirect_to)
  },
}
