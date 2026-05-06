import { error } from "@sveltejs/kit"
import { require_authentication } from "$lib/server/auth"
import { get_user_realtor_organization } from "$lib/server/organization"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { create_team } from "./actions/create_team.server"
import { fetch_teams_with_member_counts } from "./fetchers/teams.server"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)

  const realtor_org = await get_user_realtor_organization(
    locals.user.id,
  )
  if (!realtor_org) {
    error(403, "Not authorized - realtor access required")
  }

  const teams = await fetch_teams_with_member_counts(
    realtor_org.id,
  )

  return { organization: realtor_org, teams }
}

export const actions: Actions = {
  [ACTION.CREATE_TEAM]: async ({ request, locals }) => {
    require_authentication(locals)
    const realtor_org = await get_user_realtor_organization(
      locals.user.id,
    )
    if (!realtor_org) error(403, "Forbidden")

    const form_data = await request.formData()
    return create_team(form_data, realtor_org.id)
  },
}
