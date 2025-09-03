import {
  jsonArrayFrom,
  jsonObjectFrom,
} from "kysely/helpers/postgres"
import { query_builder } from "~/lib/server/query_builder"

export async function fetch_property(id: number) {
  return query_builder
    .selectFrom("property")
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .select((eb) => [
      "property.id",
      jsonArrayFrom(
        eb
          .selectFrom("room")
          .select([
            "room.id",
            "room.type",
            "room.width",
            "room.length",
          ])
          .whereRef("room.property_id", "=", "property.id"),
      ).as("rooms"),
      jsonObjectFrom(
        eb
          .selectFrom("location")
          .select([
            "location.address",
            "location.id",
            "location.latitude",
            "location.longitude",
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
