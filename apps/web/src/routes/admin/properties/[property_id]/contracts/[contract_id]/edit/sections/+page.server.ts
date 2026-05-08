import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { guard_contract_editable } from "$lib/server/guard_contract_editable"
import { require_edit_access } from "$lib/server/property_access"
import type { Actions } from "./$types"
import { ACTION } from "../actions/action"
import { add_income_guarantor } from "../actions/add_income_guarantor.server"
import { create_contract_item } from "../actions/create_contract_item.server"
import { create_contract_item_file } from "../actions/create_contract_item_file.server"
import { create_warranty } from "../actions/create_warranty.server"
import { destroy_contract_item } from "../actions/destroy_contract_item.server"
import { destroy_contract_item_file } from "../actions/destroy_contract_item_file.server"
import { destroy_income_guarantor } from "../actions/destroy_income_guarantor.server"
import { update_contract } from "../actions/update_contract.server"
import { update_contract_item } from "../actions/update_contract_item.server"
import { update_income_guarantor } from "../actions/update_income_guarantor.server"
import { update_warranty } from "../actions/update_warranty.server"

async function require_authorized(
  request: Request,
  locals: App.Locals,
  params: { property_id?: string; contract_id?: string },
) {
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
  return { property_id, contract_id }
}

export const actions: Actions = {
  [ACTION.UPDATE_CONTRACT]: async ({
    request,
    locals,
    params,
  }) => {
    const { property_id, contract_id } =
      await require_authorized(request, locals, params)
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    const form_data = await request.formData()
    return update_contract(form_data, property_id)
  },
  [ACTION.CREATE_CONTRACT_ITEM]: async ({
    request,
    locals,
    params,
  }) => {
    const { contract_id } = await require_authorized(
      request,
      locals,
      params,
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    return create_contract_item(contract_id)
  },
  [ACTION.UPDATE_CONTRACT_ITEM]: async ({
    request,
    locals,
    params,
  }) => {
    const { contract_id } = await require_authorized(
      request,
      locals,
      params,
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    const form_data = await request.formData()
    return update_contract_item(form_data)
  },
  [ACTION.DESTROY_CONTRACT_ITEM]: async ({
    request,
    locals,
    params,
  }) => {
    const { contract_id } = await require_authorized(
      request,
      locals,
      params,
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    const form_data = await request.formData()
    return destroy_contract_item(form_data)
  },
  [ACTION.CREATE_CONTRACT_ITEM_FILE]: async ({
    request,
    locals,
    params,
  }) => {
    const { contract_id } = await require_authorized(
      request,
      locals,
      params,
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    const form_data = await request.formData()
    return create_contract_item_file(form_data)
  },
  [ACTION.DESTROY_CONTRACT_ITEM_FILE]: async ({
    request,
    locals,
    params,
  }) => {
    const { contract_id } = await require_authorized(
      request,
      locals,
      params,
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    const form_data = await request.formData()
    return destroy_contract_item_file(form_data)
  },
  [ACTION.CREATE_WARRANTY]: async ({
    request,
    locals,
    params,
  }) => {
    const { contract_id } = await require_authorized(
      request,
      locals,
      params,
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    const form_data = await request.formData()
    return create_warranty(form_data)
  },
  [ACTION.UPDATE_WARRANTY]: async ({
    request,
    locals,
    params,
  }) => {
    const { contract_id } = await require_authorized(
      request,
      locals,
      params,
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    const form_data = await request.formData()
    return update_warranty(form_data)
  },
  [ACTION.ADD_INCOME_GUARANTOR]: async ({
    request,
    locals,
    params,
  }) => {
    const { contract_id } = await require_authorized(
      request,
      locals,
      params,
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    const form_data = await request.formData()
    return add_income_guarantor(form_data)
  },
  [ACTION.UPDATE_INCOME_GUARANTOR]: async ({
    request,
    locals,
    params,
  }) => {
    const { contract_id } = await require_authorized(
      request,
      locals,
      params,
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    const form_data = await request.formData()
    return update_income_guarantor(form_data)
  },
  [ACTION.DESTROY_INCOME_GUARANTOR]: async ({
    request,
    locals,
    params,
  }) => {
    const { contract_id } = await require_authorized(
      request,
      locals,
      params,
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    const form_data = await request.formData()
    return destroy_income_guarantor(form_data)
  },
}
