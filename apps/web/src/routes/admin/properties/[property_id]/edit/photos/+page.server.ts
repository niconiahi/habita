import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_edit_access } from "$lib/server/property_access"
import type { Actions } from "./$types"
import { ACTION } from "../actions/action"
import { create_property_file } from "../actions/create_property_file.server"

export const actions: Actions = {
  [ACTION.CREATE_PROPERTY_FILE]: async ({
    request,
    locals,
    params,
  }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const form_data = await request.formData()
    form_data.set("property_id", String(property_id))
    const [create_property_file_errors] =
      await create_property_file(form_data, property_id)
    if (create_property_file_errors) {
      return { errors: create_property_file_errors }
    }
    return null
  },
}
