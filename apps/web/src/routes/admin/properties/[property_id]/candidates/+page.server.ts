import { require_authentication } from "$lib/server/auth"
import { error, redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_edit_access } from "$lib/server/property_access"
import type { PageServerLoad } from "./$types"
import { fetch_candidates } from "./fetchers/candidates.server"
import { fetch_property } from "./fetchers/property.server"

export const load: PageServerLoad = async ({
  request,
  locals,
  params,
  url,
}) => {
  require_authentication(locals, url)
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
    locals.session.activeOrganizationId,
  )
  const [candidates, property] = await Promise.all([
    fetch_candidates(property_id),
    fetch_property(property_id),
  ])
  if (!property) {
    error(404, "property not found")
  }
  return { candidates, property }
}
