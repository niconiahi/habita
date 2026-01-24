import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { reassign_admin_properties } from "$lib/server/organization"
import { query_builder } from "db/query_builder"

export async function remove_admin(
  form_data: FormData,
  organization_id: string,
) {
  const admin_id = v.parse(
    ForceNumberSchema,
    form_data.get("admin_id"),
  )
  const reassign_to_raw = form_data.get("reassign_to_id")
  const reassign_to_id = reassign_to_raw
    ? v.parse(ForceNumberSchema, reassign_to_raw)
    : null

  // Reassign properties first
  await reassign_admin_properties(
    organization_id,
    admin_id,
    reassign_to_id,
  )

  // Remove member from organization
  await query_builder
    .deleteFrom("member")
    .where("organization_id", "=", organization_id)
    .where("user_id", "=", admin_id)
    .where("role", "=", "admin")
    .execute()

  return { admin_id }
}
