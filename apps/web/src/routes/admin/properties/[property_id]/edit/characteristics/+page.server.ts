import { redirect } from "@sveltejs/kit"
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
    if (!locals.user) {
      redirect(302, "/auth/google")
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
    form_data.set("property_id", String(property_id))
    const [update_location_errors] =
      await update_location(form_data)
    if (update_location_errors) {
      return { errors: update_location_errors }
    }
    return null
  },
  [ACTION.UPDATE_DESTINIES]: async ({
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
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const form_data = await request.formData()
    form_data.set("property_id", String(property_id))
    const [update_destinies_errors] =
      await update_destinies(form_data, property_id)
    if (update_destinies_errors) {
      return { errors: update_destinies_errors }
    }
    return null
  },
  [ACTION.TOGGLE_TAG]: async ({
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
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const form_data = await request.formData()
    const [toggle_tag_errors] = await toggle_tag(
      form_data,
      property_id,
    )
    if (toggle_tag_errors) {
      return { errors: toggle_tag_errors }
    }
    return null
  },
  [ACTION.UPDATE_CONSTRUCTION_YEAR]: async ({
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
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const form_data = await request.formData()
    const [update_construction_year_errors] =
      await update_construction_year(form_data, property_id)
    if (update_construction_year_errors) {
      return { errors: update_construction_year_errors }
    }
    return null
  },
  [ACTION.CREATE_SERVICE]: async ({
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
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const [create_service_errors] =
      await create_service(property_id)
    if (create_service_errors) {
      return { errors: create_service_errors }
    }
    return null
  },
  [ACTION.UPDATE_SERVICE]: async ({
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
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const form_data = await request.formData()
    form_data.set("property_id", String(property_id))
    const [update_service_errors] = await update_service(
      form_data,
      property_id,
    )
    if (update_service_errors) {
      return { errors: update_service_errors }
    }
    return null
  },
  [ACTION.DESTROY_SERVICE]: async ({
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
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session?.activeOrganizationId,
    )
    const form_data = await request.formData()
    form_data.set("property_id", String(property_id))
    const [destroy_service_errors] =
      await destroy_service(form_data)
    if (destroy_service_errors) {
      return { errors: destroy_service_errors }
    }
    return null
  },
}
