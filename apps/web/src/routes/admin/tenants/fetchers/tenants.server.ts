import { jsonObjectFrom } from "kysely/helpers/postgres"
import { query_builder } from "db/query_builder"
import { decrypt } from "$lib/server/encryption"

export async function fetch_tenants(
  admin_property_ids: number[],
) {
  if (admin_property_ids.length === 0) {
    return []
  }
  const tenants = await query_builder
    .selectFrom("user")
    .innerJoin("member", "member.user_id", "user.id")
    .innerJoin(
      "property_organization",
      "property_organization.organization_id",
      "member.organization_id",
    )
    .innerJoin(
      "property",
      "property.id",
      "property_organization.property_id",
    )
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .where("member.role", "=", "tenant")
    .where(
      "property_organization.property_id",
      "in",
      admin_property_ids,
    )
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
