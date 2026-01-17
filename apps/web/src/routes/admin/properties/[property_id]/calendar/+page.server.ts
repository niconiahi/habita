import { redirect, error } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import {
  get_property_accesses,
  require_edit_access,
} from "$lib/server/property_access"
import { PROPERTY_STATE } from "$lib/property_state"
import { fetch_slots } from "./fetchers/slots.server"
import { fetch_property } from "./fetchers/property.server"
import { create_slot } from "./actions/create_slot.server"
import { destroy_slot } from "./actions/destroy_slot.server"
import { ACTION } from "./actions/action"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
  locals,
  params,
}) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
    {
      message: "property id should be a number",
    },
  )
  const property_accesses = get_property_accesses(
    locals.user,
    property_id,
  )
  require_edit_access(property_accesses)
  const [slots, property] = await Promise.all([
    fetch_slots(property_id),
    fetch_property(property_id),
  ])
  if (!property) {
    error(404, "property not found")
  }
  if (property.state !== PROPERTY_STATE.PUBLISHED) {
    redirect(302, "/admin/properties")
  }
  return { slots, property, user: locals.user }
}

export const actions: Actions = {
  [ACTION.CREATE_SLOT]: async ({
    request,
    locals,
    params,
  }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    const property_accesses = get_property_accesses(
      locals.user,
      property_id,
    )
    require_edit_access(property_accesses)
    const form_data = await request.formData()
    form_data.set("property_id", String(property_id))
    form_data.set("host_id", String(locals.user.id))
    await create_slot(form_data)
    return null
  },
  [ACTION.DESTROY_SLOT]: async ({
    request,
    locals,
    params,
  }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    const property_accesses = get_property_accesses(
      locals.user,
      property_id,
    )
    require_edit_access(property_accesses)
    const form_data = await request.formData()
    await destroy_slot(form_data)
    return null
  },
}
