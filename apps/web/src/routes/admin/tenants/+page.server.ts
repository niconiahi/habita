import { redirect } from "@sveltejs/kit"
import { get_edit_property_ids } from "$lib/server/organization"
import { fetch_tenants } from "./fetchers/tenants.server"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  const property_ids = await get_edit_property_ids(
    locals.user.id,
  )
  const tenants = await fetch_tenants(property_ids)
  return { tenants }
}
