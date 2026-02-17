import { redirect } from "@sveltejs/kit"
import { request_demo } from "./actions/request_demo.server"
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
    try {
      await request_demo(locals.user.email)
      return { success: true }
    } catch {
      return { success: false }
    }
  },
}
