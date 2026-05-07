import { error } from "@sveltejs/kit"
import { require_authentication } from "$lib/server/auth"
import { require_active_realtor_organization } from "$lib/server/organization"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { reassign_property } from "./actions/reassign_property.server"
import {
  fetch_team_member,
  fetch_team_peers,
} from "./fetchers/member.server"
import { fetch_managed_properties } from "./fetchers/properties.server"
import { fetch_team } from "../../fetchers/team.server"

const USER_ID_RADIX = 10

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
  if (!team) error(404, "Equipo no encontrado")

  const user_id = Number.parseInt(
    params.user_id,
    USER_ID_RADIX,
  )
  if (Number.isNaN(user_id)) {
    error(404, "Miembro no encontrado")
  }

  const member = await fetch_team_member(team.id, user_id)
  if (!member) error(404, "Miembro no encontrado")

  const [properties, peers] = await Promise.all([
    fetch_managed_properties(member.id),
    fetch_team_peers(team.id, member.id),
  ])

  return { team, member, properties, peers }
}

export const actions: Actions = {
  [ACTION.REASSIGN_PROPERTY]: async ({
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
    return reassign_property(form_data)
  },
}
