import { query_builder } from "db/query_builder"
import { decrypt } from "$lib/server/encryption"

export async function fetch_tenant_by_id(
  tenant_id: number,
) {
  const tenant = await query_builder
    .selectFrom("user")
    .where("user.id", "=", tenant_id)
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.email",
    ])
    .executeTakeFirst()
  if (!tenant) return undefined
  return {
    ...tenant,
    name: decrypt(tenant.name),
    surname: decrypt(tenant.surname),
  }
}
export type TenantDetail = NonNullable<
  Awaited<ReturnType<typeof fetch_tenant_by_id>>
>
