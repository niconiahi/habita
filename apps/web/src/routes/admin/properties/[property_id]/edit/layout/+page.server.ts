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
      form_data.get("direction") === "down"
        ? "down"
        : "up"
    const [create_floor_errors] =
      await create_floor(property_id, direction)
    if (create_floor_errors) {
      return { errors: create_floor_errors }
    }
    return null
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
    const [update_floor_errors] =
      await update_floor(form_data)
    if (update_floor_errors) {
      return { errors: update_floor_errors }
    }
    return null
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
    const [destroy_floor_errors] =
      await destroy_floor(form_data)
    if (destroy_floor_errors) {
      return { errors: destroy_floor_errors }
    }
    return null
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
    const [create_room_errors] = await create_room(floor_id)
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
    const [destroy_room_errors] =
      await destroy_room(form_data)
    if (destroy_room_errors) {
      return { errors: destroy_room_errors }
    }
    return null
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
    const [reorder_floors_errors] =
      await reorder_floors(form_data, property_id)
    if (reorder_floors_errors) {
      return { errors: reorder_floors_errors }
    }
    return null
  },
}
