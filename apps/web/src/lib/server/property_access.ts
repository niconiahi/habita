import { error } from "@sveltejs/kit"
import {
  has_property_role,
  type OrganizationRole,
} from "./organization"

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
    "landlord",
    "admin",
    "tenant",
  ])
}

export async function require_edit_access(
  user_id: number,
  property_id: number,
) {
  return require_property_role(user_id, property_id, [
    "landlord",
    "admin",
  ])
}

export async function require_landlord_access(
  user_id: number,
  property_id: number,
) {
  return require_property_role(user_id, property_id, [
    "landlord",
  ])
}
