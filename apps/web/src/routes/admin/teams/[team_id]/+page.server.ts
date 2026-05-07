import { error } from "@sveltejs/kit"
import { require_authentication } from "$lib/server/auth"
import { require_active_realtor_organization } from "$lib/server/organization"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { destroy_team } from "./actions/destroy_team.server"
import { invite_to_team } from "./actions/invite_to_team.server"
import { remove_from_team } from "./actions/remove_from_team.server"
import { update_team_name } from "./actions/update_team_name.server"
import { fetch_team_members_with_property_counts } from "./fetchers/members.server"
import { fetch_team } from "./fetchers/team.server"

export const load: PageServerLoad = async ({
  locals,
  params,
  url,
}) => {
  require_authentication(locals, url)

  const realtor_org = require_active_realtor_organization(
    locals.session.activeOrganizationId,
    locals.subscriptions,
  )

  const team = await fetch_team(
    params.team_id,
    realtor_org.id,
  )
  if (!team) {
    error(404, "Equipo no encontrado")
  }

  const members =
    await fetch_team_members_with_property_counts(team.id)

  return { team, members }
}

export const actions: Actions = {
  [ACTION.INVITE_TO_TEAM]: async ({
    request,
    locals,
    params,
  }) => {
    require_authentication(locals)
    const realtor_org = require_active_realtor_organization(
      locals.session.activeOrganizationId,
      locals.subscriptions,
    )

    const team = await fetch_team(
      params.team_id,
      realtor_org.id,
    )
    if (!team) error(404, "Equipo no encontrado")

    const form_data = await request.formData()
    return invite_to_team(
      form_data,
      realtor_org.id,
      team.id,
      locals.user.id,
    )
  },

  [ACTION.REMOVE_FROM_TEAM]: async ({
    request,
    locals,
    params,
  }) => {
    require_authentication(locals)
    const realtor_org = require_active_realtor_organization(
      locals.session.activeOrganizationId,
      locals.subscriptions,
    )

    const team = await fetch_team(
      params.team_id,
      realtor_org.id,
    )
    if (!team) error(404, "Equipo no encontrado")

    const form_data = await request.formData()
    return remove_from_team(form_data, team.id)
  },

  [ACTION.UPDATE_TEAM_NAME]: async ({
    request,
    locals,
    params,
  }) => {
    require_authentication(locals)
    const realtor_org = require_active_realtor_organization(
      locals.session.activeOrganizationId,
      locals.subscriptions,
    )

    const team = await fetch_team(
      params.team_id,
      realtor_org.id,
    )
    if (!team) error(404, "Equipo no encontrado")

    const form_data = await request.formData()
    return update_team_name(form_data, team.id)
  },

  [ACTION.DESTROY_TEAM]: async ({ locals, params }) => {
    require_authentication(locals)
    const realtor_org = require_active_realtor_organization(
      locals.session.activeOrganizationId,
      locals.subscriptions,
    )

    const team = await fetch_team(
      params.team_id,
      realtor_org.id,
    )
    if (!team) error(404, "Equipo no encontrado")

    return destroy_team(team.id)
  },
}
