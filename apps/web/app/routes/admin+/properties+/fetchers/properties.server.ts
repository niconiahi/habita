import { jsonObjectFrom } from "kysely/helpers/postgres"
import { query_builder } from "~/lib/query_builder.server"

export async function fetch_properties(
  admin_property_ids: number[],
) {
  if (admin_property_ids.length === 0) {
    return []
  }
  return query_builder
    .selectFrom("property")
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .where("property.id", "in", admin_property_ids)
    .select((eb) => [
      "property.id",
      "property.state",
      "property.type",
      "property.unit",
      jsonObjectFrom(
        eb
          .selectFrom("location")
          .select([
            "location.id",
            "location.address",
            "location.latitude",
            "location.longitude",
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
}

export type Property = NonNullable<
  Awaited<ReturnType<typeof fetch_properties>>[0]
>
