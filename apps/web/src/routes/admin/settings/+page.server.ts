import { error } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { require_authentication } from "$lib/server/auth"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { update_organization_name } from "./actions/update_organization_name.server"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)

  const organization_id =
    locals.session.activeOrganizationId
  if (!organization_id) {
    error(400, "No hay organización activa")
  }

  const organization = await query_builder
    .selectFrom("organization")
    .where("id", "=", organization_id)
    .select(["id", "name"])
    .executeTakeFirstOrThrow()

  return { organization }
}

export const actions: Actions = {
  [ACTION.UPDATE_ORGANIZATION_NAME]: async ({
    locals,
    request,
  }) => {
    require_authentication(locals)

    const organization_id =
      locals.session.activeOrganizationId
    if (!organization_id) {
      error(400, "No hay organización activa")
    }

    const form_data = await request.formData()
    return update_organization_name(
      form_data,
      organization_id,
      request.headers,
    )
  },
}
