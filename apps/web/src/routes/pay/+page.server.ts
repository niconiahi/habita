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
    const [create_payment_errors, create_payment_data] =
      await create_payment()
    if (create_payment_errors) {
      return { errors: create_payment_errors }
    }
    redirect(303, create_payment_data.init_point)
  },
}
