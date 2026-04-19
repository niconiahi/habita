import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_edit_access } from "$lib/server/property_access"
import type { Actions } from "./$types"
import { ACTION } from "../actions/action"
import { create_pdf } from "../actions/create_pdf.server"
import { check_certificates } from "../actions/digital_signature/check_certificates.server"
import { send_for_signing } from "../actions/digital_signature/send_for_signing.server"
import { start_onboarding } from "../actions/digital_signature/start_onboarding.server"
import { verify_signature } from "../actions/digital_signature/verify_signature.server"

export const actions: Actions = {
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
    const [
      check_certificates_errors,
      check_certificates_data,
    ] = await check_certificates(property_id)
    if (check_certificates_errors) {
      return { errors: check_certificates_errors }
    }
    return check_certificates_data
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
