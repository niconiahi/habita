import { query_builder } from "~/lib/query_builder.server"

export async function fetch_tenant_by_id(tenant_id: number) {
  return query_builder
    .selectFrom("user")
    .where("user.id", "=", tenant_id)
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.email",
    ])
    .executeTakeFirst()
}

export type TenantDetail = NonNullable<
  Awaited<ReturnType<typeof fetch_tenant_by_id>>
>
