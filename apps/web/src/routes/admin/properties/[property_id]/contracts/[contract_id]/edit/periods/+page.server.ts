import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_edit_access } from "$lib/server/property_access"
import type { Actions } from "./$types"
import { ACTION } from "../actions/action"
import { create_period } from "../actions/create_period.server"
import { update_period } from "../actions/update_period.server"

export const actions: Actions = {
  [ACTION.CREATE_PERIOD]: async ({
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
    const contract_id = v.parse(
      ForceNumberSchema,
      params.contract_id,
    )
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const form_data = await request.formData()
    const [create_period_errors] = await create_period(
      form_data,
      contract_id,
    )
    if (create_period_errors) {
      return { errors: create_period_errors }
    }
    return null
  },
  [ACTION.UPDATE_PERIOD]: async ({
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
    const [update_period_errors] =
      await update_period(form_data)
    if (update_period_errors) {
      return { errors: update_period_errors }
    }
    return null
  },
}
