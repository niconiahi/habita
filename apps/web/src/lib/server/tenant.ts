import { query_builder } from "db/query_builder"
import { decrypt } from "$lib/server/encryption"

export async function fetch_tenant(property_id: number) {
  const tenant = await query_builder
    .selectFrom("user")
    .innerJoin("member", "member.user_id", "user.id")
    .innerJoin(
      "property_organization",
      "property_organization.organization_id",
      "member.organization_id",
    )
    .where((eb) =>
      eb.and([
        eb("member.role", "=", "tenant"),
        eb(
          "property_organization.property_id",
          "=",
          property_id,
        ),
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
    name: decrypt(tenant.name),
    surname: decrypt(tenant.surname),
    phone_number: tenant.phone_number
      ? decrypt(tenant.phone_number)
      : null,
    document_number: tenant.document_number
      ? decrypt(tenant.document_number)
      : null,
  }
}
export type Tenant = Awaited<
  ReturnType<typeof fetch_tenant>
>
