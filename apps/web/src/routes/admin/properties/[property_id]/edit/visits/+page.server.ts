import { require_authentication } from "$lib/server/auth"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_edit_access } from "$lib/server/property_access"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { create_slot } from "./actions/create_slot.server"
import { destroy_slot } from "./actions/destroy_slot.server"
import { fetch_slots } from "./fetchers/slots.server"

export const load: PageServerLoad = async ({
  request,
  locals,
  params,
}) => {
  require_authentication(locals)
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
    locals.session.activeOrganizationId,
  )
  const slots = await fetch_slots(property_id)
  return { slots, user: locals.user }
}

export const actions: Actions = {
  [ACTION.CREATE_SLOT]: async ({
    request,
    locals,
    params,
  }) => {
    require_authentication(locals)
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
    const form_data = await request.formData()
    form_data.set("property_id", String(property_id))
    form_data.set("host_id", String(locals.user.id))
    const [create_slot_errors] =
      await create_slot(form_data)
    if (create_slot_errors) {
      return { errors: create_slot_errors }
    }
    return null
  },
  [ACTION.DESTROY_SLOT]: async ({
    request,
    locals,
    params,
  }) => {
    require_authentication(locals)
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
    const form_data = await request.formData()
    const [destroy_slot_errors] =
      await destroy_slot(form_data)
    if (destroy_slot_errors) {
      return { errors: destroy_slot_errors }
    }
    return null
  },
}
