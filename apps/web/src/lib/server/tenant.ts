import { query_builder } from "db/query_builder"
import { ACCESS_TYPE } from "$lib/access_type"
import { decrypt } from "$lib/server/encryption"

export async function fetch_tenant(property_id: number) {
  const tenant = await query_builder
    .selectFrom("user")
    .innerJoin(
      "property_access",
      "property_access.user_id",
      "user.id",
    )
    .where("property_access.property_id", "=", property_id)
    .where("property_access.type", "=", ACCESS_TYPE.TENANT)
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.phone_number",
      "user.document_number",
      "user.cuil",
      "user.email",
    ])
    .executeTakeFirst()
  if (!tenant) return undefined
  return {
    ...tenant,
    name: decrypt(tenant.name),
    surname: decrypt(tenant.surname),
    phone_number: tenant.phone_number
      ? decrypt(tenant.phone_number)
      : null,
    document_number: tenant.document_number
      ? decrypt(tenant.document_number)
      : null,
    cuil: tenant.cuil ? decrypt(tenant.cuil) : null,
  }
}
export type Tenant = Awaited<
  ReturnType<typeof fetch_tenant>
>
