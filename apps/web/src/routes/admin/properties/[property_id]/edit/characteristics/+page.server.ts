import { require_authentication } from "$lib/server/auth"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_edit_access } from "$lib/server/property_access"
import type { Actions } from "./$types"
import { ACTION } from "../actions/action"
import { create_service } from "../actions/create_service.server"
import { destroy_service } from "../actions/destroy_service.server"
import { toggle_tag } from "../actions/toggle_tag.server"
import { update_construction_year } from "../actions/update_construction_year.server"
import { update_destinies } from "../actions/update_destinies.server"
import { update_location } from "../actions/update_location.server"
import { update_service } from "../actions/update_service.server"

export const actions: Actions = {
  [ACTION.UPDATE_LOCATION]: async ({
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
    return update_location(form_data)
  },
  [ACTION.UPDATE_DESTINIES]: async ({
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
    return update_destinies(form_data, property_id)
  },
  [ACTION.TOGGLE_TAG]: async ({
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
    return toggle_tag(form_data, property_id)
  },
  [ACTION.UPDATE_CONSTRUCTION_YEAR]: async ({
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
    return update_construction_year(form_data, property_id)
  },
  [ACTION.CREATE_SERVICE]: async ({
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
    return create_service(property_id)
  },
  [ACTION.UPDATE_SERVICE]: async ({
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
    return update_service(form_data, property_id)
  },
  [ACTION.DESTROY_SERVICE]: async ({
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
    return destroy_service(form_data)
  },
}
