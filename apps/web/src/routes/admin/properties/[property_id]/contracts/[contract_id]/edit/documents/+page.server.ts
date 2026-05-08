import { error, fail, redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_authentication } from "$lib/server/auth"
import { guard_contract_editable } from "$lib/server/guard_contract_editable"
import { is_webmaster } from "$lib/server/is_webmaster"
import { require_edit_access } from "$lib/server/property_access"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "../actions/action"
import { activate_contract } from "../actions/activate_contract.server"
import { create_file } from "../actions/create_file.server"
import { create_pdf } from "../actions/create_pdf.server"
import { check_certificates } from "../actions/digital_signature/check_certificates.server"
import { send_for_signing } from "../actions/digital_signature/send_for_signing.server"
import { start_onboarding } from "../actions/digital_signature/start_onboarding.server"
import { verify_signature } from "../actions/digital_signature/verify_signature.server"
import { fetch_tenant_insurance_files } from "../fetchers/tenant_insurance_files.server"

export const load: PageServerLoad = async ({
  request,
  locals,
  params,
  url,
}) => {
  require_authentication(locals, url)
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  await require_edit_access(
    request.headers,
    locals.user.id,
    property_id,
    locals.session.activeOrganizationId,
  )
  const tenant_insurance_files =
    await fetch_tenant_insurance_files(property_id)
  return { tenant_insurance_files }
}

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
    const contract_id = v.parse(
      ForceNumberSchema,
      params.contract_id,
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    const form_data = await request.formData()
    return create_file(form_data)
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
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    const form_data = await request.formData()
    return create_pdf(form_data, property_id)
  },
  [ACTION.ACTIVATE_CONTRACT]: async ({
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
    )
    return activate_contract(contract_id)
  },
  [ACTION.CHECK_CERTIFICATES]: async ({
    request,
    locals,
    params,
  }) => {
    if (!locals.user || !is_webmaster(locals.user)) {
      error(404, "Not found")
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
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    return check_certificates(property_id)
  },
  [ACTION.START_ONBOARDING]: async ({
    request,
    locals,
    params,
  }) => {
    if (!locals.user || !is_webmaster(locals.user)) {
      error(404, "Not found")
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
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    const form_data = await request.formData()
    return start_onboarding(form_data, property_id)
  },
  [ACTION.SEND_FOR_SIGNING]: async ({
    request,
    locals,
    params,
  }) => {
    if (!locals.user || !is_webmaster(locals.user)) {
      error(404, "Not found")
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
    )
    const guard = await guard_contract_editable(contract_id)
    if (guard) return guard
    const form_data = await request.formData()
    return send_for_signing(form_data, property_id)
  },
  [ACTION.VERIFY_SIGNATURE]: async ({
    request,
    locals,
    params,
  }) => {
    if (!locals.user || !is_webmaster(locals.user)) {
      error(404, "Not found")
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
    return verify_signature(
      form_data,
      property_id,
      contract_id,
    )
  },
}
