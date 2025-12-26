import { query_builder } from "db/query_builder"
import { ACCESS_TYPE } from "$lib/access_type"

export async function fetch_tenant(property_id: number) {
  return query_builder
    .selectFrom("user")
    .innerJoin("access", "access.user_id", "user.id")
    .innerJoin(
      "property",
      "property.id",
      "access.property_id",
    )
    .where((eb) =>
      eb.and([
        eb("access.type", "=", ACCESS_TYPE.TENANT),
        eb("property.id", "=", property_id),
      ]),
    )
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.phone_number",
      "user.document_number",
    ])
    .executeTakeFirst()
}
export type Tenant = Awaited<
  ReturnType<typeof fetch_tenant>
>
