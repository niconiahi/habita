import { require_authentication } from "$lib/server/auth"
import { error, redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import {
  get_accessible_property_ids,
  is_tenant_accessible,
} from "$lib/server/property_access"
import type { PageServerLoad } from "./$types"
import { fetch_tenant_by_id } from "./fetchers/tenant.server"

export const load: PageServerLoad = async ({
  locals,
  params,
  url,
}) => {
  require_authentication(locals, url)
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
      locals.session.activeOrganizationId,
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
