import { redirect, error } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { ACCESS_TYPE } from "$lib/access_type"
import {
  get_accessible_property_ids,
  is_tenant_accessible,
} from "$lib/server/property_access"
import { fetch_tenant_by_id } from "./fetchers/tenant.server"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  locals,
  params,
}) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  const tenant_id = v.parse(
    ForceNumberSchema,
    params.tenant_id,
    {
      message: "tenant id should be a number",
    },
  )
  const manager_property_ids =
    await get_accessible_property_ids(
      locals.user.id,
      [ACCESS_TYPE.LANDLORD, ACCESS_TYPE.MANAGER],
      locals.session?.activeOrganizationId,
    )
  const has_access = await is_tenant_accessible(
    tenant_id,
    manager_property_ids,
  )
  if (!has_access) {
    error(403, "not authorized")
  }
  const tenant = await fetch_tenant_by_id(tenant_id)
  if (!tenant) {
    error(404, "tenant not found")
  }
  return { tenant }
}
