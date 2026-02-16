import { redirect } from "@sveltejs/kit"
import { ACCESS_TYPE } from "$lib/access_type"
import { get_accessible_property_ids } from "$lib/server/property_access"
import { fetch_available_properties } from "./fetchers/available_properties.server"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  const manager_property_ids =
    await get_accessible_property_ids(
      locals.user.id,
      [ACCESS_TYPE.LANDLORD, ACCESS_TYPE.MANAGER],
      locals.session?.activeOrganizationId,
    )
  const available_properties =
    await fetch_available_properties(manager_property_ids)
  return { available_properties }
}

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    const form_data = await request.formData()
    const property_id = form_data.get("property_id")
    if (!property_id) {
      return { error: "Debes seleccionar una propiedad" }
    }
    redirect(
      303,
      `/admin/properties/${property_id}/contracts/new`,
    )
  },
}
