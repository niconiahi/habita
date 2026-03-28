import { query_builder } from "db/query_builder"
import { jsonObjectFrom } from "kysely/helpers/postgres"
import { ACCESS_TYPE } from "$lib/access_type"
import { decrypt } from "$lib/server/encryption"

export async function fetch_tenants(
  manager_property_ids: number[],
) {
  if (manager_property_ids.length === 0) {
    return []
  }
  const tenants = await query_builder
    .selectFrom("user")
    .innerJoin(
      "property_access",
      "property_access.user_id",
      "user.id",
    )
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
    .where("property_access.type", "=", ACCESS_TYPE.TENANT)
    .where("property.id", "in", manager_property_ids)
    .select((eb) => [
      "user.id",
      "user.name",
      "user.surname",
      "user.email",
      "property.id as property_id",
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
  return tenants.map((tenant) => ({
    ...tenant,
    name: decrypt(tenant.name),
    surname: decrypt(tenant.surname),
  }))
}

export type Tenant = NonNullable<
  Awaited<ReturnType<typeof fetch_tenants>>[0]
>
