import { query_builder } from "db/query_builder"
import { now } from "~/lib/now"

export async function create_service(property_id: number) {
  const type = await query_builder
    .selectFrom("service")
    .innerJoin(
      "property",
      "property.id",
      "service.property_id",
    )
    .select(["service.id"])
    .executeTakeFirstOrThrow()
  await query_builder
    .insertInto("service")
    .values({
      code: "",
      type: type.id,
      updated_at: now,
      created_at: now,
      property_id,
    })
    .execute()
}
