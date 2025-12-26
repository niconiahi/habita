import { redirect } from "@sveltejs/kit"
import { ACCESS_TYPE } from "$lib/access_type"
import { fetch_candidates } from "./fetchers/candidates.server"
import type { PageServerLoad } from "./$types"

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
