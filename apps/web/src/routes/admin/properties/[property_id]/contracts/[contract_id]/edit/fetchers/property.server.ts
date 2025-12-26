import { query_builder } from "db/query_builder"

export function fetch_property(id: number) {
  return query_builder
    .selectFrom("property")
    .select(["property.id", "property.destinies"])
    .where("property.id", "=", id)
    .executeTakeFirst()
}
export type Property = NonNullable<
  Awaited<ReturnType<typeof fetch_property>>
>
