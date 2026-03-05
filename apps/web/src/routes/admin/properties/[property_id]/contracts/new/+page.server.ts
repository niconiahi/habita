import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { get_contract_types } from "$lib/contract_type"
import { require_edit_access } from "$lib/server/property_access"
import { create_contract } from "./actions/create_contract.server"
import { ACTION } from "./actions/action"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
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
  const contract_types = get_contract_types()
  return { contract_types }
}

export const actions: Actions = {
  [ACTION.CREATE_CONTRACT]: async ({
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
    const [errors, data] = await create_contract(
      form_data,
      property_id,
    )
    if (errors) {
      return { errors }
    }
    redirect(303, data.redirect_to)
  },
}
