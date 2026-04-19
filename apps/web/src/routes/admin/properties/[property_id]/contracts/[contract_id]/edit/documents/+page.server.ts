import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_edit_access } from "$lib/server/property_access"
import type { Actions } from "./$types"
import { ACTION } from "../actions/action"
import { create_file } from "../actions/create_file.server"
import { destroy_file } from "../actions/destroy_file.server"

export const actions: Actions = {
  [ACTION.CREATE_FILE]: async ({
    request,
    locals,
    params,
  }) => {
    if (!locals.user) {
      redirect(302, "/properties")
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
    const [create_file_errors] =
      await create_file(form_data)
    if (create_file_errors) {
      return { errors: create_file_errors }
    }
    return null
  },
  [ACTION.DESTROY_FILE]: async ({
    request,
    locals,
    params,
  }) => {
    if (!locals.user) {
      redirect(302, "/properties")
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
    const [destroy_file_errors] =
      await destroy_file(form_data)
    if (destroy_file_errors) {
      return { errors: destroy_file_errors }
    }
    return null
  },
}
