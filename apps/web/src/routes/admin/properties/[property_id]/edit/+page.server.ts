import { error, redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { PROPERTY_STATE } from "$lib/property_state"
import { require_edit_access } from "$lib/server/property_access"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { create_property_file } from "./actions/create_property_file.server"
import { create_room } from "./actions/create_room.server"
import { create_service } from "./actions/create_service.server"
import { destroy_room } from "./actions/destroy_room.server"
import { destroy_service } from "./actions/destroy_service.server"
import { invite_landlord } from "./actions/invite_landlord.server"
import { toggle_tag } from "./actions/toggle_tag.server"
import { update_construction_year } from "./actions/update_construction_year.server"
import { update_destinies } from "./actions/update_destinies.server"
import { update_location } from "./actions/update_location.server"
import { update_room } from "./actions/update_room.server"
import { update_room_positions } from "./actions/update_room_positions.server"
import { update_service } from "./actions/update_service.server"
import { fetch_property } from "./fetchers/property.server"

export const load: PageServerLoad = async ({
  locals,
  params,
  request,
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
  await require_edit_access(
    request.headers,
    locals.user.id,
    property_id,
    locals.session?.activeOrganizationId,
  )
  const property = await fetch_property(property_id)
  if (!property) {
    error(
      404,
      `property does not exist for id ${property_id}`,
    )
  }
  if (property.state === PROPERTY_STATE.RENTED) {
    redirect(302, "/admin/properties")
  }
  return { property }
}

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
  [ACTION.CREATE_ROOM]: async ({
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
    const [create_room_errors] =
      await create_room(property_id)
    if (create_room_errors) {
      return { errors: create_room_errors }
    }
    return null
  },
  [ACTION.UPDATE_ROOM]: async ({
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
    const [update_room_errors] =
      await update_room(form_data)
    if (update_room_errors) {
      return { errors: update_room_errors }
    }
    return null
  },
  [ACTION.UPDATE_ROOM_POSITIONS]: async ({
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
    const [update_room_positions_errors] =
      await update_room_positions(form_data)
    if (update_room_positions_errors) {
      return { errors: update_room_positions_errors }
    }
    return null
  },
  [ACTION.DESTROY_ROOM]: async ({
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
    const [destroy_room_errors] =
      await destroy_room(form_data)
    if (destroy_room_errors) {
      return { errors: destroy_room_errors }
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
  [ACTION.CREATE_PROPERTY_FILE]: async ({
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
    const [create_property_file_errors] =
      await create_property_file(form_data, property_id)
    if (create_property_file_errors) {
      return { errors: create_property_file_errors }
    }
    return null
  },
  [ACTION.INVITE_LANDLORD]: async ({
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
    const [invite_landlord_errors] =
      await invite_landlord(form_data)
    if (invite_landlord_errors) {
      return { errors: invite_landlord_errors }
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
}
