import { require_authentication } from "$lib/server/auth"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)
  return {}
}
