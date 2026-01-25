import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { query_builder } from "db/query_builder"
import { ACCESS_TYPE } from "$lib/access_type"

export async function remove_manager(
  form_data: FormData,
  organization_id: string,
) {
  const manager_id = v.parse(
    ForceNumberSchema,
    form_data.get("manager_id"),
  )
  await query_builder
    .deleteFrom("property_access")
    .where("user_id", "=", manager_id)
    .where("type", "=", ACCESS_TYPE.MANAGER)
    .execute()
  await query_builder
    .deleteFrom("member")
    .where("organization_id", "=", organization_id)
    .where("user_id", "=", manager_id)
    .where("role", "=", "manager")
    .execute()
  return { manager_id }
}
