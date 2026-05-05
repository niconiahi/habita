import { require_authentication } from "$lib/server/auth"
import { error } from "@sveltejs/kit"
import { is_webmaster } from "$lib/server/is_webmaster"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { create_payment } from "./actions/create_payment.server"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)
  if (!is_webmaster(locals.user)) {
    error(403, "forbidden")
  }
  return {}
}

export const actions: Actions = {
  [ACTION.CREATE_PAYMENT]: async ({ locals }) => {
    require_authentication(locals)
    if (!is_webmaster(locals.user)) {
      error(403, "forbidden")
    }
    return create_payment()
  },
}
