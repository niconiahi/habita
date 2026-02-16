import { decrypt } from "$lib/server/encryption"
import { query_builder } from "db/query_builder"
import { sql } from "kysely"
import { ACCESS_TYPE } from "$lib/access_type"

export async function fetch_managers_with_property_counts(
  realtor_id: number,
) {
  const managers = await query_builder
    .selectFrom("realtor")
    .innerJoin("user", "user.id", "realtor.user_id")
    .where("realtor.realtor_id", "=", realtor_id)
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.email",
      "realtor.created_at",
    ])
    .execute()
  const managers_with_counts = await Promise.all(
    managers.map(async (manager) => {
      const result = await query_builder
        .selectFrom("property_access")
        .where("user_id", "=", manager.id)
        .where("type", "=", ACCESS_TYPE.MANAGER)
        .select(sql<number>`count(*)::int`.as("count"))
        .executeTakeFirst()
      return {
        ...manager,
        name: manager.name ? decrypt(manager.name) : null,
        surname: manager.surname
          ? decrypt(manager.surname)
          : null,
        property_count: result?.count ?? 0,
      }
    }),
  )
  return managers_with_counts
}

export type Manager = Awaited<
  ReturnType<typeof fetch_managers_with_property_counts>
>[number]
