import { query_builder } from "db/query_builder"
import { ACCESS_TYPE } from "$lib/access_type"
import { decrypt } from "$lib/server/encryption"

export async function fetch_tenant(property_id: number) {
  const tenant = await query_builder
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
      "user.email",
    ])
    .executeTakeFirst()
  if (!tenant) return undefined
  return {
    ...tenant,
    phone_number: tenant.phone_number ? decrypt(tenant.phone_number) : null,
    document_number: tenant.document_number
      ? decrypt(tenant.document_number)
      : null,
  }
}
export type Tenant = Awaited<ReturnType<typeof fetch_tenant>>
