import { query_builder } from "../../../db/query_builder"
import type { ACCESS_TYPE } from "../access_type"

export async function grant_access_by_email(
  property_id: number,
  email: string,
  type: (typeof ACCESS_TYPE)[keyof typeof ACCESS_TYPE],
): Promise<void> {
  const user = await query_builder
    .selectFrom("user")
    .select("id")
    .where("email", "=", email)
    .executeTakeFirst()

  if (!user) {
    console.log(
      `grant_access_by_email: user ${email} not found - skipping`,
    )
    return
  }

  const existing = await query_builder
    .selectFrom("property_access")
    .select("id")
    .where("property_id", "=", property_id)
    .where("user_id", "=", user.id)
    .where("type", "=", type)
    .executeTakeFirst()

  if (existing) {
    console.log(
      "grant_access_by_email: access already exists - skipping",
    )
    return
  }

  const now = new Date().toISOString()
  await query_builder
    .insertInto("property_access")
    .values({
      property_id,
      user_id: user.id,
      type,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log(
    `grant_access_by_email: granted ${type} access to ${email} for property ${property_id}`,
  )
}
