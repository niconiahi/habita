import { require_authentication } from "$lib/server/auth"
import { require_active_realtor_organization } from "$lib/server/organization"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { create_team } from "./actions/create_team.server"
import { fetch_teams_with_member_counts } from "./fetchers/teams.server"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)

  const realtor_org = require_active_realtor_organization(
    locals.session.activeOrganizationId,
    locals.subscriptions,
  )

  const teams = await fetch_teams_with_member_counts(
    realtor_org.id,
  )

  return { teams }
}

export const actions: Actions = {
  [ACTION.CREATE_TEAM]: async ({ request, locals }) => {
    require_authentication(locals)
    const realtor_org = require_active_realtor_organization(
      locals.session.activeOrganizationId,
      locals.subscriptions,
    )

    const form_data = await request.formData()
    return create_team(form_data, realtor_org.id)
  },
}
