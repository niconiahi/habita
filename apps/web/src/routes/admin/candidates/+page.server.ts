import { require_authentication } from "$lib/server/auth"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import {
  get_accessible_property_ids,
  require_edit_access,
} from "$lib/server/property_access"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { set_tenant } from "./actions/index.server"
import { fetch_candidates } from "./fetchers/candidates.server"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)
  const property_ids = await get_accessible_property_ids(
    locals.user.id,
    [ACCESS_TYPE.LANDLORD, ACCESS_TYPE.MANAGER],
    locals.session.activeOrganizationId,
  )
  const candidates = await fetch_candidates(property_ids)
  return { candidates }
}

export const actions: Actions = {
  [ACTION.SET_TENANT]: async ({ request, locals }) => {
    require_authentication(locals)
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      form_data.get("property_id"),
    )
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session.activeOrganizationId,
    )
    return set_tenant(form_data)
  },
}
