import { error, redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import { fetch_candidates } from "./fetchers/candidates.server"
import { set_tenant } from "./actions/index.server"
import { ACTION } from "./actions/action"
import type { Actions, PageServerLoad } from "./$types"
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  const property_ids = locals.user.accesses
    .filter(
      (access) =>
        access.type === ACCESS_TYPE.OWNER ||
        access.type === ACCESS_TYPE.ADMINISTRATOR,
    )
    .map((access) => access.property_id)
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
    const has_access = locals.user.accesses.some(
      (access) =>
        access.property_id === property_id &&
        (access.type === ACCESS_TYPE.OWNER ||
          access.type === ACCESS_TYPE.ADMINISTRATOR),
    )
    if (!has_access) {
      error(403, "not authorized")
    }
    const { redirect_to } = await set_tenant(form_data)
    redirect(303, redirect_to)
  },
}
