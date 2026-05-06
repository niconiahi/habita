import { query_builder } from "db/query_builder"
import { ACCESS_TYPE } from "$lib/access_type"

export async function fetch_managed_properties(
  user_id: number,
) {
  return query_builder
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
    .where("property_access.type", "=", ACCESS_TYPE.MANAGER)
    .select([
      "property.id",
      "property.unit",
      "property.state",
      "property.type",
      "location.address",
      "location.suburb",
    ])
    .orderBy("property.created_at", "desc")
    .execute()
}

export type ManagedProperty = Awaited<
  ReturnType<typeof fetch_managed_properties>
>[number]
