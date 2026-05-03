import { redirect } from "@sveltejs/kit"
import { require_authentication } from "$lib/server/auth"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { select_account_type } from "./actions/select_account_type.server"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)
}

export const actions: Actions = {
  [ACTION.SELECT_ACCOUNT_TYPE]: async ({
    locals,
    request,
  }) => {
    require_authentication(locals)
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
