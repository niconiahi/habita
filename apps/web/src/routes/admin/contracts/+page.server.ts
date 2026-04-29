import { redirect } from "@sveltejs/kit"
import { require_authentication } from "$lib/server/auth"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ContractStateSchema } from "$lib/contract_state"
import { get_accessible_property_ids } from "$lib/server/property_access"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { set_state } from "./actions/set_state.server"
import { fetch_contracts } from "./fetchers/contracts.server"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)
  const state_param = url.searchParams.get("state")
  const state =
    state_param !== null
      ? v.parse(ContractStateSchema, Number(state_param))
      : undefined
  const property_ids = await get_accessible_property_ids(
    locals.user.id,
    [ACCESS_TYPE.LANDLORD, ACCESS_TYPE.MANAGER],
    locals.session.activeOrganizationId,
  )
  const contracts = await fetch_contracts(
    property_ids,
    state !== undefined ? [state] : undefined,
  )
  return { contracts, state: state ?? null }
}

export const actions: Actions = {
  [ACTION.SET_STATE]: async ({ request }) => {
    const form_data = await request.formData()
    const [set_state_errors, set_state_data] =
      await set_state(request, form_data)
    if (set_state_errors) {
      return { errors: set_state_errors }
    }
    redirect(303, set_state_data.redirect_to)
  },
}
