import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
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

export const actions: Actions = {
  [ACTION.UPDATE_CONTRACT]: async ({
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
      {
        message: "property id should be a number",
      },
    )
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const form_data = await request.formData()
    const [update_contract_errors] = await update_contract(
      form_data,
      property_id,
    )
    if (update_contract_errors) {
      return { errors: update_contract_errors }
    }
    return null
  },
  [ACTION.CREATE_CONTRACT_ITEM]: async ({
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
    const contract_id = v.parse(
      ForceNumberSchema,
      params.contract_id,
      {
        message: "contract id should be a number",
      },
    )
    const [create_contract_item_errors] =
      await create_contract_item(contract_id)
    if (create_contract_item_errors) {
      return { errors: create_contract_item_errors }
    }
    return null
  },
  [ACTION.UPDATE_CONTRACT_ITEM]: async ({
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
    const [update_contract_item_errors] =
      await update_contract_item(form_data)
    if (update_contract_item_errors) {
      return { errors: update_contract_item_errors }
    }
    return null
  },
  [ACTION.DESTROY_CONTRACT_ITEM]: async ({
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
    const [destroy_contract_item_errors] =
      await destroy_contract_item(form_data)
    if (destroy_contract_item_errors) {
      return { errors: destroy_contract_item_errors }
    }
    return null
  },
  [ACTION.CREATE_CONTRACT_ITEM_FILE]: async ({
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
    const [create_contract_item_file_errors] =
      await create_contract_item_file(form_data)
    if (create_contract_item_file_errors) {
      return { errors: create_contract_item_file_errors }
    }
    return null
  },
  [ACTION.DESTROY_CONTRACT_ITEM_FILE]: async ({
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
    const [destroy_contract_item_file_errors] =
      await destroy_contract_item_file(form_data)
    if (destroy_contract_item_file_errors) {
      return { errors: destroy_contract_item_file_errors }
    }
    return null
  },
  [ACTION.CREATE_WARRANTY]: async ({
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
    const [create_warranty_errors] =
      await create_warranty(form_data)
    if (create_warranty_errors) {
      return { errors: create_warranty_errors }
    }
    return null
  },
  [ACTION.UPDATE_WARRANTY]: async ({
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
    const [update_warranty_errors] =
      await update_warranty(form_data)
    if (update_warranty_errors) {
      return { errors: update_warranty_errors }
    }
    return null
  },
  [ACTION.ADD_INCOME_GUARANTOR]: async ({
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
    const [add_income_guarantor_errors] =
      await add_income_guarantor(form_data)
    if (add_income_guarantor_errors) {
      return { errors: add_income_guarantor_errors }
    }
    return null
  },
  [ACTION.UPDATE_INCOME_GUARANTOR]: async ({
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
    const [update_income_guarantor_errors] =
      await update_income_guarantor(form_data)
    if (update_income_guarantor_errors) {
      return { errors: update_income_guarantor_errors }
    }
    return null
  },
  [ACTION.DESTROY_INCOME_GUARANTOR]: async ({
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
    const [destroy_income_guarantor_errors] =
      await destroy_income_guarantor(form_data)
    if (destroy_income_guarantor_errors) {
      return { errors: destroy_income_guarantor_errors }
    }
    return null
  },
}
