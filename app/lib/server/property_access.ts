import { ACCESS_TYPE } from "./access_type"
import type { Auth } from "./auth"

export function get_property_accesses(
  user: NonNullable<Auth["user"]>,
  property_id: number,
) {
  return user.accesses.filter(
    (access) => access.property_id === property_id,
  )
}

export function has_view_access(
  property_accesses: Array<{ role: string }>,
): boolean {
  return property_accesses.length > 0
}

export function has_edit_access(
  property_accesses: Array<{ role: string }>,
): boolean {
  return property_accesses.some(
    (access) =>
      Number(access.role) === ACCESS_TYPE.OWNER ||
      Number(access.role) === ACCESS_TYPE.ADMINISTRATOR,
  )
}

export function require_view_access(
  property_accesses: Array<{ role: string }>,
): void {
  if (!has_view_access(property_accesses)) {
    throw new Response("Forbidden", { status: 403 })
  }
}

export function require_edit_access(
  property_accesses: Array<{ role: string }>,
): void {
  if (!has_edit_access(property_accesses)) {
    throw new Response("Forbidden", { status: 403 })
  }
}
