import { redirect } from "@sveltejs/kit"
import { request_demo } from "./actions/request_demo.server"
import { REQUEST_DEMO_ERROR } from "./actions/request_demo.server"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/login")
  }
}

export const actions: Actions = {
  default: async ({ locals }) => {
    if (!locals.user) {
      redirect(302, "/login")
    }
    const [request_demo_error] = await request_demo(
      locals.user.email,
    )
    if (request_demo_error) {
      if (
        request_demo_error.type ===
        REQUEST_DEMO_ERROR.FETCH_FAILED
      ) {
        // NOTE: fill the action message
        return { success: false }
      }
      if (
        request_demo_error.type ===
        REQUEST_DEMO_ERROR.SERVICE_ERROR
      ) {
        // NOTE: fill the action message
        return { success: false }
      }
      return { success: false }
    }
    return { success: true }
  },
}
