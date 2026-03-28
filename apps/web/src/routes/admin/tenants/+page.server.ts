import { redirect } from "@sveltejs/kit"
import { ACCESS_TYPE } from "$lib/access_type"
import { get_accessible_property_ids } from "$lib/server/property_access"
import type { PageServerLoad } from "./$types"
import { fetch_tenants } from "./fetchers/tenants.server"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  const property_ids = await get_accessible_property_ids(
    locals.user.id,
    [ACCESS_TYPE.LANDLORD, ACCESS_TYPE.MANAGER],
    locals.session?.activeOrganizationId,
  )
  const tenants = await fetch_tenants(property_ids)
  return { tenants }
}
