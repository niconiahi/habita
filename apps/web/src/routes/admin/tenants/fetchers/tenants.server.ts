import { jsonObjectFrom } from "kysely/helpers/postgres"
import { query_builder } from "db/query_builder"
import { ACCESS_TYPE } from "$lib/access_type"
import { decrypt } from "$lib/server/encryption"

export async function fetch_tenants(
  admin_property_ids: number[],
) {
  if (admin_property_ids.length === 0) {
    return []
  }
  const tenants = await query_builder
    .selectFrom("user")
    .innerJoin("access", "access.user_id", "user.id")
    .innerJoin(
      "property",
      "property.id",
      "access.property_id",
    )
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .where("access.type", "=", ACCESS_TYPE.TENANT)
    .where("access.property_id", "in", admin_property_ids)
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
