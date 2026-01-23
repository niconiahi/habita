import { error } from "@sveltejs/kit"
import {
  has_property_role,
  type OrganizationRole,
} from "./organizations"

export async function require_property_role(
  user_id: number,
  property_id: number,
  roles: OrganizationRole[],
) {
  const has_role = await has_property_role(
    user_id,
    property_id,
    roles,
  )
  if (!has_role) error(403, "Forbidden")
}

export async function require_view_access(
  user_id: number,
  property_id: number,
) {
  return require_property_role(user_id, property_id, [
    "owner",
    "admin",
    "tenant",
  ])
}

export async function require_edit_access(
  user_id: number,
  property_id: number,
) {
  return require_property_role(user_id, property_id, [
    "owner",
    "admin",
  ])
}

export async function require_owner_access(
  user_id: number,
  property_id: number,
) {
  return require_property_role(user_id, property_id, [
    "owner",
  ])
}
