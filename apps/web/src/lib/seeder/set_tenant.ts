import { query_builder } from "../../../db/query_builder"
import { ACCESS_TYPE } from "../access_type"

export async function set_tenant(
  property_id: number,
  user_id: number,
): Promise<void> {
  const now = new Date().toISOString()
  await query_builder
    .insertInto("property_access")
    .values({
      property_id,
      user_id,
      type: ACCESS_TYPE.TENANT,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log(
    `set tenant: user ${user_id} -> property ${property_id}`,
  )
}
