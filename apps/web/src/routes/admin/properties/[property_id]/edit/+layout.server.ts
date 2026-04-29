import { require_authentication } from "$lib/server/auth"
import { error } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_edit_access } from "$lib/server/property_access"
import type { LayoutServerLoad } from "./$types"
import { fetch_property } from "./fetchers/property.server"

export const load: LayoutServerLoad = async ({
  locals,
  params,
  request,
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
  const property = await fetch_property(property_id)
  if (!property) {
    error(
      404,
      `property does not exist for id ${property_id}`,
    )
  }
  return { property }
}
