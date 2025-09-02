import { jsonArrayFrom } from "kysely/helpers/postgres"
import { query_builder } from "~/lib/server/query_builder"

export async function fetch_property(id: string) {
  return query_builder
    .selectFrom("property")
    .selectAll()
    .select((eb) => [
      jsonArrayFrom(
        eb
          .selectFrom("room")
          .selectAll()
          .whereRef("room.property_id", "=", "property.id"),
      ).as("rooms"),
    ])
    .where("property.id", "=", id)
    .executeTakeFirst()
}
export type Property = NonNullable<
  Awaited<ReturnType<typeof fetch_property>>
>
