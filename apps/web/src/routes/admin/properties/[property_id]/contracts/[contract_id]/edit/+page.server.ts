import { redirect, error } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { get_contract_file_types } from "$lib/contract_file_type"
import { require_edit_access } from "$lib/server/property_access"
import { fetch_landlord } from "$lib/server/landlord"
import { fetch_tenant } from "$lib/server/tenant"
import { query_builder } from "db/query_builder"
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
import { create_period } from "./actions/create_period.server"
import { create_warranty } from "./actions/create_warranty.server"
import { update_warranty } from "./actions/update_warranty.server"
import { add_income_guarantor } from "./actions/add_income_guarantor.server"
import { update_income_guarantor } from "./actions/update_income_guarantor.server"
import { destroy_income_guarantor } from "./actions/destroy_income_guarantor.server"
import { check_certificates } from "./actions/digital_signature/check_certificates.server"
import { start_onboarding } from "./actions/digital_signature/start_onboarding.server"
import { send_for_signing } from "./actions/digital_signature/send_for_signing.server"
import { verify_signature } from "./actions/digital_signature/verify_signature.server"
import { ACTION } from "./actions/action"

async function fetch_signature(contract_id: number) {
  return query_builder
    .selectFrom("digital_signature")
    .where("contract_id", "=", contract_id)
    .select([
      "id",
      "contract_id",
      "document_id",
      "group_id",
      "landlord_url",
      "tenant_url",
      "landlord_status",
      "tenant_status",
      "created_at",
      "updated_at",
    ])
    .executeTakeFirst()
}

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
    locals.session?.activeOrganizationId,
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
  const [landlord, tenant, warranty, signature] =
    await Promise.all([
      fetch_landlord(property_id),
      fetch_tenant(property_id),
      fetch_warranty(contract.warranty_id),
      fetch_signature(contract_id),
    ])
  const contract_file_types = get_contract_file_types()
  return {
    contract,
    property,
    landlord,
    tenant,
    warranty,
    contract_file_types,
    signature: signature ?? null,
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
      locals.session?.activeOrganizationId,
    )
    const form_data = await request.formData()
    const [create_pdf_errors] = await create_pdf(
      form_data,
      property_id,
    )
    if (create_pdf_errors) {
      return { errors: create_pdf_errors }
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
  [ACTION.CHECK_CERTIFICATES]: async ({
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
    const [check_certificates_errors] =
      await check_certificates(property_id)
    if (check_certificates_errors) {
      return { errors: check_certificates_errors }
    }
    return null
  },
  [ACTION.START_ONBOARDING]: async ({
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
    const [start_onboarding_errors] =
      await start_onboarding(form_data, property_id)
    if (start_onboarding_errors) {
      return { errors: start_onboarding_errors }
    }
    return null
  },
  [ACTION.SEND_FOR_SIGNING]: async ({
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
    const [send_for_signing_errors] =
      await send_for_signing(form_data, property_id)
    if (send_for_signing_errors) {
      return { errors: send_for_signing_errors }
    }
    return null
  },
  [ACTION.VERIFY_SIGNATURE]: async ({
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
    const [verify_signature_errors] =
      await verify_signature(
        form_data,
        property_id,
        contract_id,
      )
    if (verify_signature_errors) {
      return { errors: verify_signature_errors }
    }
    return null
  },
}
