import { require_authentication } from "$lib/server/auth"
import { query_builder } from "db/query_builder"
import { jsonObjectFrom } from "kysely/helpers/postgres"
import type { AccessType } from "$lib/access_type"
import { display_location } from "$lib/display_location"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  locals,
}) => {
  require_authentication(locals)
  const properties = await fetch_properties_with_access(
    locals.user.id,
  )
  return { properties }
}

async function fetch_properties_with_access(
  user_id: number,
) {
  const rows = await query_builder
    .selectFrom("property_access")
    .innerJoin(
      "property",
      "property.id",
      "property_access.property_id",
    )
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .where("property_access.user_id", "=", user_id)
    .select((eb) => [
      "property.id",
      "property_access.type",
      jsonObjectFrom(
        eb
          .selectFrom("location")
          .select([
            "location.road",
            "location.house_number",
            "location.suburb",
            "location.city",
            "location.town",
            "location.state",
          ])
          .whereRef(
            "location.id",
            "=",
            "property.location_id",
          ),
      )
        .$notNull()
        .as("location"),
    ])
    .execute()

  const grouped = new Map<
    number,
    {
      id: number
      display_name: string
      access_types: AccessType[]
    }
  >()

  for (const row of rows) {
    const existing = grouped.get(row.id)
    if (existing) {
      existing.access_types.push(row.type as AccessType)
    } else {
      grouped.set(row.id, {
        id: row.id,
        display_name: display_location(row.location),
        access_types: [row.type as AccessType],
      })
    }
  }

  return Array.from(grouped.values())
}
