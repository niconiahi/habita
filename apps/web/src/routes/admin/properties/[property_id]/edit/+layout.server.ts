import { require_authentication } from "$lib/server/auth"
import { error, redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { PROPERTY_STATE } from "$lib/property_state"
import { require_edit_access } from "$lib/server/property_access"
import type { LayoutServerLoad } from "./$types"
import { fetch_visits } from "./fetchers/visits.server"
import { fetch_property } from "./fetchers/property.server"

export const load: LayoutServerLoad = async ({
  locals,
  params,
  request,
}) => {
  require_authentication(locals)
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
  const [property, visits] = await Promise.all([
    fetch_property(property_id),
    fetch_visits(property_id),
  ])
  if (!property) {
    error(
      404,
      `property does not exist for id ${property_id}`,
    )
  }
  if (property.state === PROPERTY_STATE.RENTED) {
    redirect(302, "/admin/properties")
  }
  return { property, visits }
}
