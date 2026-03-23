import { redirect } from "@sveltejs/kit"
import { select_account_type } from "./actions/select_account_type.server"
import { ACTION } from "./actions/action"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/login")
  }
}

export const actions: Actions = {
  [ACTION.SELECT_ACCOUNT_TYPE]: async ({
    locals,
    request,
  }) => {
    if (!locals.user) {
      redirect(302, "/login")
    }
    const form_data = await request.formData()
    const [errors, data] = await select_account_type(
      form_data,
      locals.user.id,
    )
    if (errors) {
      return { errors }
    }
    redirect(303, data.redirect_path)
  },
}
