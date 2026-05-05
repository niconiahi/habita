import { require_authentication } from "$lib/server/auth"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_edit_access } from "$lib/server/property_access"
import type { Actions } from "./$types"
import { ACTION } from "../actions/action"
import { create_floor } from "../actions/create_floor.server"
import { create_room } from "../actions/create_room.server"
import { destroy_floor } from "../actions/destroy_floor.server"
import { destroy_room } from "../actions/destroy_room.server"
import { update_floor } from "../actions/update_floor.server"
import { update_room } from "../actions/update_room.server"
import { update_room_positions } from "../actions/update_room_positions.server"
import { reorder_floors } from "../actions/reorder_floors.server"
import { create_room_file } from "../actions/create_room_file.server"
import { destroy_room_file } from "../actions/destroy_room_file.server"

export const actions: Actions = {
  [ACTION.CREATE_FLOOR]: async ({
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
    const direction =
      form_data.get("direction") === "down" ? "down" : "up"
    return create_floor(property_id, direction)
  },
  [ACTION.UPDATE_FLOOR]: async ({
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
    return update_floor(form_data)
  },
  [ACTION.DESTROY_FLOOR]: async ({
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
    return destroy_floor(form_data)
  },
  [ACTION.CREATE_ROOM]: async ({
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
    const floor_id = v.parse(
      ForceNumberSchema,
      form_data.get("floor_id"),
    )
    return create_room(floor_id)
  },
  [ACTION.UPDATE_ROOM]: async ({
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
    return update_room(form_data)
  },
  [ACTION.UPDATE_ROOM_POSITIONS]: async ({
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
    return update_room_positions(form_data)
  },
  [ACTION.DESTROY_ROOM]: async ({
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
    return destroy_room(form_data)
  },
  [ACTION.REORDER_FLOORS]: async ({
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
    return reorder_floors(form_data, property_id)
  },
  [ACTION.CREATE_ROOM_FILE]: async ({
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
    return create_room_file(form_data)
  },
  [ACTION.DESTROY_ROOM_FILE]: async ({
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
    return destroy_room_file(form_data)
  },
}
