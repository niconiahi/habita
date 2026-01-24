import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ContractStateSchema } from "$lib/contract_state"
import { get_edit_property_ids } from "$lib/server/organization"
import { fetch_contracts } from "./fetchers/contracts.server"
import { set_state } from "./actions/set_state.server"
import { ACTION } from "./actions/action"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  const state = v.parse(
    ContractStateSchema,
    Number(url.searchParams.get("state")),
  )
  const property_ids = await get_edit_property_ids(
    locals.user.id,
  )
  const contracts = await fetch_contracts(property_ids, [
    state,
  ])
  return { contracts, state }
}

export const actions: Actions = {
  [ACTION.SET_STATE]: async ({ request }) => {
    const form_data = await request.formData()
    try {
      const { redirect_to } = await set_state.execute(
        request,
        form_data,
      )
      redirect(303, redirect_to)
    } catch (err) {
      if (err instanceof v.ValiError) {
        return {
          errors: {
            set_state: set_state.get_errors(err),
          },
        }
      }
      throw err
    }
  },
}
