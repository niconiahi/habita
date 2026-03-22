import { query_builder } from "db/query_builder"

export function fetch_zones() {
  return query_builder
    .selectFrom("zone")
    .select([
      "zone.id",
      "zone.name",
      "zone.admin_level",
      "zone.label",
      "zone.badge",
    ])
    .orderBy("zone.name")
    .execute()
}
