import { redirect, error } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { get_contract_types } from "$lib/contract_type"
import { has_edit_access } from "$lib/server/property_access"
import { create_contract } from "./actions/create_contract.server"
import { ACTION } from "./actions/action"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  if (!has_edit_access(locals.user.accesses)) {
    error(400, "not found")
  }
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
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    const { redirect_to } = await create_contract(
      form_data,
      property_id,
    )
    redirect(303, redirect_to)
  },
}
