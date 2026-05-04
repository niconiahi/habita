import { mask_house_number } from "$lib/mask_house_number"
import { require_authentication } from "$lib/server/auth"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import { require_property_access } from "$lib/server/property_access"
import type { PageServerLoad } from "./$types"

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
  await require_property_access(
    request.headers,
    locals.user.id,
    property_id,
    [ACCESS_TYPE.LANDLORD],
    locals.session.activeOrganizationId,
    { property: ["read"] },
  )
  const property_location =
    await fetch_property_location(property_id)
  return {
    property_id,
    property_location: property_location
      ? mask_house_number(property_location)
      : undefined,
  }
}

function fetch_property_location(property_id: number) {
  return query_builder
    .selectFrom("property")
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .where("property.id", "=", property_id)
    .select(["location.road", "location.house_number"])
    .executeTakeFirst()
}
