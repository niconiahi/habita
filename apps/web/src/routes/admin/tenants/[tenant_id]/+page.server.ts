import { redirect, error } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import {
  get_edit_property_ids,
  is_tenant_in_admin_properties,
} from "$lib/server/organizations"
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
  const admin_property_ids = await get_edit_property_ids(
    locals.user.id,
  )
  const has_access = await is_tenant_in_admin_properties(
    tenant_id,
    admin_property_ids,
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
