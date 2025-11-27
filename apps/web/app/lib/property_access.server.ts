import * as v from "valibot"
import {
  ACCESS_TYPE,
  type AccessType,
  AccessTypeSchema,
} from "~/lib/access_type"
import type { Auth } from "./auth.server"

export function get_property_accesses(
  user: NonNullable<Auth["user"]>,
  property_id: number,
) {
  return user.accesses.filter(
    (access) => access.property_id === property_id,
  )
}

export function has_view_access(
  property_accesses: Array<{ type: number | AccessType }>,
): boolean {
  return property_accesses.length > 0
}

export function has_tenant_access(
  property_accesses: Array<{ type: number | AccessType }>,
): boolean {
  return property_accesses.some((access) => {
    const access_type = v.parse(
      AccessTypeSchema,
      access.type,
    )
    return access_type === ACCESS_TYPE.TENANT
  })
}

export function has_edit_access(
  property_accesses: Array<{ type: number | AccessType }>,
): boolean {
  return property_accesses.some((access) => {
    const access_type = v.parse(
      AccessTypeSchema,
      access.type,
    )
    return (
      access_type === ACCESS_TYPE.OWNER ||
      access_type === ACCESS_TYPE.ADMINISTRATOR
    )
  })
}

export function require_view_access(
  property_accesses: Array<{ type: number | AccessType }>,
): void {
  if (!has_view_access(property_accesses)) {
    throw new Response("not authorized", { status: 403 })
  }
}

export function require_edit_access(
  property_accesses: Array<{ type: number | AccessType }>,
): void {
  if (!has_edit_access(property_accesses)) {
    throw new Response("not authorized", { status: 403 })
  }
}
