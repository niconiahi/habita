import { require_authentication } from "$lib/server/auth"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import {
  get_accessible_property_ids,
  require_edit_access,
} from "$lib/server/property_access"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { publish_property } from "./actions/publish_property.server"
import { unpublish_property } from "./actions/unpublish_property.server"
import { fetch_properties } from "./fetchers/properties.server"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)
  const property_ids = await get_accessible_property_ids(
    locals.user.id,
    [ACCESS_TYPE.LANDLORD, ACCESS_TYPE.MANAGER],
    locals.session.activeOrganizationId,
  )
  const properties = await fetch_properties(property_ids)
  return { properties }
}

export const actions: Actions = {
  [ACTION.PUBLISH_PROPERTY]: async ({
    request,
    locals,
  }) => {
    require_authentication(locals)
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      form_data.get("property_id"),
    )
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session.activeOrganizationId,
    )
    const [publish_property_errors] =
      await publish_property(form_data)
    if (publish_property_errors) {
      return { errors: publish_property_errors }
    }
    return null
  },
  [ACTION.UNPUBLISH_PROPERTY]: async ({
    request,
    locals,
  }) => {
    require_authentication(locals)
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      form_data.get("property_id"),
    )
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session.activeOrganizationId,
    )
    const [unpublish_property_errors] =
      await unpublish_property(form_data)
    if (unpublish_property_errors) {
      return { errors: unpublish_property_errors }
    }
    return null
  },
}
