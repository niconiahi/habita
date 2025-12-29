import { redirect, error } from "@sveltejs/kit"
import { is_webmaster } from "$lib/server/is_webmaster"
import { create_payment } from "./actions/create_payment.server"
import { ACTION } from "./actions/action"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  if (!is_webmaster(locals.user)) {
    error(403, "forbidden")
  }
  return {}
}

export const actions: Actions = {
  [ACTION.CREATE_PAYMENT]: async ({ locals }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    if (!is_webmaster(locals.user)) {
      error(403, "forbidden")
    }
    const init_point = await create_payment()
    redirect(303, init_point)
  },
}
