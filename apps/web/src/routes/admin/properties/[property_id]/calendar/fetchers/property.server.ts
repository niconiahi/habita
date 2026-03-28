import { query_builder } from "db/query_builder"
import { jsonObjectFrom } from "kysely/helpers/postgres"

export function fetch_property(id: number) {
  return query_builder
    .selectFrom("property")
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .select((eb) => [
      "property.id",
      "property.state",
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
    .where("property.id", "=", id)
    .executeTakeFirst()
}

export type Property = NonNullable<
  Awaited<ReturnType<typeof fetch_property>>
>
