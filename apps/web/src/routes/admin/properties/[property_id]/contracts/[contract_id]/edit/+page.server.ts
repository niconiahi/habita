import { redirect, error } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { get_contract_file_types } from "$lib/contract_file_type"
import { require_edit_access } from "$lib/server/property_access"
import { fetch_landlord } from "$lib/server/landlord"
import { fetch_tenant } from "$lib/server/tenant"
import { fetch_contract } from "./fetchers/contract.server"
import { fetch_property } from "./fetchers/property.server"
import { fetch_warranty } from "./fetchers/warranty.server"
import type { PageServerLoad, Actions } from "./$types"
import { update_contract } from "./actions/update_contract.server"
import { create_file } from "./actions/create_file.server"
import { destroy_file } from "./actions/destroy_file.server"
import { create_pdf } from "./actions/create_pdf.server"
import { create_contract_item } from "./actions/create_contract_item.server"
import { update_contract_item } from "./actions/update_contract_item.server"
import { destroy_contract_item } from "./actions/destroy_contract_item.server"
import { create_contract_item_file } from "./actions/create_contract_item_file.server"
import { destroy_contract_item_file } from "./actions/destroy_contract_item_file.server"
import { update_period } from "./actions/update_period.server"
import { create_warranty } from "./actions/create_warranty.server"
import { update_warranty } from "./actions/update_warranty.server"
import { add_income_guarantor } from "./actions/add_income_guarantor.server"
import { update_income_guarantor } from "./actions/update_income_guarantor.server"
import { destroy_income_guarantor } from "./actions/destroy_income_guarantor.server"
import { ACTION } from "./actions/action"

export const load: PageServerLoad = async ({
  request,
  locals,
  params,
}) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  const contract_id = v.parse(
    ForceNumberSchema,
    params.contract_id,
    {
      message: "contract id should be a number",
    },
  )
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
  )
  const [contract, property] = await Promise.all([
    fetch_contract(contract_id),
    fetch_property(property_id),
  ])
  if (!contract) {
    error(
      404,
      `contract does not exist for id ${contract_id}`,
    )
  }
  if (!property) {
    error(
      404,
      `property does not exist for id ${property_id}`,
    )
  }
  const [landlord, tenant, warranty] = await Promise.all([
    fetch_landlord(property_id),
    fetch_tenant(property_id),
    fetch_warranty(contract.warranty_id),
  ])
  const contract_file_types = get_contract_file_types()
  return {
    contract,
    property,
    landlord,
    tenant,
    warranty,
    contract_file_types,
  }
}

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
    )
    const form_data = await request.formData()
    await update_contract(form_data, property_id)
    return null
  },
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
    )
    const form_data = await request.formData()
    await create_file(form_data)
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
    )
    const form_data = await request.formData()
    await destroy_file(form_data)
    return null
  },
  [ACTION.CREATE_PDF]: async ({
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
    )
    const form_data = await request.formData()
    return await create_pdf(form_data, property_id)
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
    )
    const contract_id = v.parse(
      ForceNumberSchema,
      params.contract_id,
      {
        message: "contract id should be a number",
      },
    )
    await create_contract_item(contract_id)
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
    )
    const form_data = await request.formData()
    await update_contract_item(form_data)
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
    )
    const form_data = await request.formData()
    await destroy_contract_item(form_data)
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
    )
    const form_data = await request.formData()
    await create_contract_item_file(form_data)
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
    )
    const form_data = await request.formData()
    await destroy_contract_item_file(form_data)
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
    )
    const form_data = await request.formData()
    await update_period(form_data)
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
    )
    const form_data = await request.formData()
    return await create_warranty(form_data)
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
    )
    const form_data = await request.formData()
    await update_warranty(form_data)
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
    )
    const form_data = await request.formData()
    await add_income_guarantor(form_data)
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
    )
    const form_data = await request.formData()
    await update_income_guarantor(form_data)
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
    )
    const form_data = await request.formData()
    await destroy_income_guarantor(form_data)
    return null
  },
}
