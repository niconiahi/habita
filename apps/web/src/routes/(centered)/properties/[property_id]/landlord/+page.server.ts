import { require_authentication } from "$lib/server/auth"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import { require_property_access } from "$lib/server/property_access"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  request,
  locals,
  params,
}) => {
  require_authentication(locals)
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
    {
      message: "property id should be a number",
    },
  )
  await require_property_access(
    request.headers,
    locals.user.id,
    property_id,
    [ACCESS_TYPE.LANDLORD],
    locals.session.activeOrganizationId,
    { property: ["read"] },
  )
}
