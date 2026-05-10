import { error } from "@sveltejs/kit"

import { require_authentication } from "$lib/server/auth"
import { is_webmaster } from "$lib/server/is_webmaster"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals, url }) => {
  if (process.env.OTEL_ENVIRONMENT !== "development") {
    error(404, "not found")
  }
  require_authentication(locals, url)
  if (!is_webmaster(locals.user)) {
    error(403, "forbidden")
  }
  return {}
}
