import { redirect, error } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { has_edit_access } from "$lib/server/property_access"
import { fetch_property } from "./fetchers/property.server"
import { update_location } from "./actions/update_location.server"
import { create_room } from "./actions/create_room.server"
import { update_room } from "./actions/update_room.server"
import { update_room_positions } from "./actions/update_room_positions.server"
import { destroy_room } from "./actions/destroy_room.server"
import { create_service } from "./actions/create_service.server"
import { update_service } from "./actions/update_service.server"
import { destroy_service } from "./actions/destroy_service.server"
import { create_property_file } from "./actions/create_property_file.server"
import { invite_owner } from "./actions/invite_owner.server"
import { update_destinies } from "./actions/update_destinies.server"
import { ACTION } from "./actions/action"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
  locals,
  params,
}) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  if (!has_edit_access(locals.user.accesses)) {
    error(400, "not found")
  }
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
    {
      message: "property id should be a number",
    },
  )
  const property = await fetch_property(property_id)
  if (!property) {
    error(
      404,
      `property does not exist for id ${property_id}`,
    )
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
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    form_data.set("property_id", String(property_id))
    update_location(form_data)
    return null
  },
  [ACTION.CREATE_ROOM]: async ({ locals, params }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    create_room(property_id)
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
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    form_data.set("property_id", String(property_id))
    update_room(form_data)
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
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    form_data.set("property_id", String(property_id))
    await update_room_positions(form_data)
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
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    form_data.set("property_id", String(property_id))
    destroy_room(form_data)
    return null
  },
  [ACTION.CREATE_SERVICE]: async ({ locals, params }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    create_service(property_id)
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
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    form_data.set("property_id", String(property_id))
    try {
      await update_service(form_data, property_id)
      return null
    } catch {
      return {
        error: "Sólo puede haber un servicio de cada tipo",
      }
    }
  },
  [ACTION.DESTROY_SERVICE]: async ({
    request,
    locals,
    params,
  }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    form_data.set("property_id", String(property_id))
    destroy_service(form_data)
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
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    form_data.set("property_id", String(property_id))
    create_property_file(form_data, property_id)
    return null
  },
  [ACTION.INVITE_OWNER]: async ({
    request,
    locals,
    params,
  }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    form_data.set("property_id", String(property_id))
    invite_owner(form_data)
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
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const form_data = await request.formData()
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    form_data.set("property_id", String(property_id))
    await update_destinies(form_data, property_id)
    return null
  },
}
