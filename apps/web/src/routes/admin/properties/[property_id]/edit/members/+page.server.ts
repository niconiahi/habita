import { require_authentication } from "$lib/server/auth"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_edit_access } from "$lib/server/property_access"
import type { Actions } from "./$types"
import { ACTION } from "../actions/action"
import { invite_landlord } from "../actions/invite_landlord.server"

export const actions: Actions = {
  [ACTION.INVITE_LANDLORD]: async ({
    request,
    locals,
    params,
  }) => {
    require_authentication(locals)
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session.activeOrganizationId,
    )
    const form_data = await request.formData()
    form_data.set("property_id", String(property_id))
    const [invite_landlord_errors] =
      await invite_landlord(form_data)
    if (invite_landlord_errors) {
      return { errors: invite_landlord_errors }
    }
    return null
  },
}
