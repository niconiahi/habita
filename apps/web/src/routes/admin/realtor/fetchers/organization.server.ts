import { query_builder } from "db/query_builder"

export async function fetch_organization_details(
  organization_id: string,
) {
  return query_builder
    .selectFrom("organization")
    .where("id", "=", organization_id)
    .select(["id", "name", "slug", "logo"])
    .executeTakeFirstOrThrow()
}

export type Organization = Awaited<
  ReturnType<typeof fetch_organization_details>
>
