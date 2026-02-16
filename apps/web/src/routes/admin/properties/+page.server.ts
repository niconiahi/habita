import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { ACCESS_TYPE } from "$lib/access_type"
import {
  require_edit_access,
  get_accessible_property_ids,
} from "$lib/server/property_access"
import { fetch_properties } from "./fetchers/properties.server"
import { publish_property } from "./actions/publish_property.server"
import { unpublish_property } from "./actions/unpublish_property.server"
import { ACTION } from "./actions/action"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  const property_ids = await get_accessible_property_ids(
    locals.user.id,
    [ACCESS_TYPE.LANDLORD, ACCESS_TYPE.MANAGER],
    locals.session?.activeOrganizationId,
  )
  const properties = await fetch_properties(property_ids)
  return { properties }
}

export const actions: Actions = {
  [ACTION.PUBLISH_PROPERTY]: async ({
    request,
    locals,
  }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      form_data.get("property_id"),
    )
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
    )
    await publish_property(form_data)
    return null
  },
  [ACTION.UNPUBLISH_PROPERTY]: async ({
    request,
    locals,
  }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      form_data.get("property_id"),
    )
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
    )
    await unpublish_property(form_data)
    return null
  },
}
