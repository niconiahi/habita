import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { ACCESS_TYPE } from "$lib/access_type"
import {
  require_edit_access,
  get_accessible_property_ids,
} from "$lib/server/property_access"
import { fetch_candidates } from "./fetchers/candidates.server"
import { set_tenant } from "./actions/index.server"
import { ACTION } from "./actions/action"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  const property_ids = await get_accessible_property_ids(
    locals.user.id,
    [ACCESS_TYPE.LANDLORD, ACCESS_TYPE.MANAGER],
    locals.session?.activeOrganizationId,
  )
  const candidates = await fetch_candidates(property_ids)
  return { candidates }
}

export const actions: Actions = {
  [ACTION.SET_TENANT]: async ({ request, locals }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      form_data.get("property_id"),
    )
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const { redirect_to } = await set_tenant(form_data)
    redirect(303, redirect_to)
  },
}
