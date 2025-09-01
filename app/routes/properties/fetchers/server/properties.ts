import { jsonArrayFrom } from "kysely/helpers/postgres"
import { query_builder } from "~/lib/server/query_builder"

export async function fetch_properties() {
  return query_builder
    .selectFrom("property")
    .selectAll("property")
    .select((eb) => [
      jsonArrayFrom(
        eb
          .selectFrom("room")
          .selectAll("room")
          .whereRef("room.property_id", "=", "property.id"),
      ).as("rooms"),
    ])
    .execute()
}
