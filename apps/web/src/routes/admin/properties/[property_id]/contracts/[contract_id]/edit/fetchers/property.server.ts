import { query_builder } from "db/query_builder"
import { jsonObjectFrom } from "kysely/helpers/postgres"

export function fetch_property(id: number) {
  return query_builder
    .selectFrom("property")
    .select((eb) => [
      "property.id",
      "property.destinies",
      jsonObjectFrom(
        eb
          .selectFrom("location")
          .select([
            "location.road",
            "location.house_number",
          ])
          .whereRef(
            "location.id",
            "=",
            "property.location_id",
          ),
      ).as("location"),
    ])
    .where("property.id", "=", id)
    .executeTakeFirst()
}
export type Property = NonNullable<
  Awaited<ReturnType<typeof fetch_property>>
>
