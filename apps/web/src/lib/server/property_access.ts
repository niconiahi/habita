import { error } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { auth } from "./auth"
import {
  ACCESS_TYPE,
  type AccessType,
} from "$lib/access_type"

export async function require_property_access(
  headers: Headers,
  user_id: number,
  property_id: number,
  allowed_types: AccessType[],
  active_organization_id: string | null | undefined,
  permissions: Record<string, string[]>,
) {
  // role-based permission check (RBAC — Role-Based Access Control)
  if (active_organization_id) {
    const result = await auth.api.hasPermission({
      headers,
      body: {
        permissions,
        organizationId: active_organization_id,
      },
    })
    if (!result.success) error(403, "Forbidden")
  }
  // property-specific assignment check (ACL - Access Control List)
  let query = query_builder
    .selectFrom("property_access")
    .innerJoin(
      "property",
      "property.id",
      "property_access.property_id",
    )
    .where("property_access.property_id", "=", property_id)
    .where("property_access.user_id", "=", user_id)
    .where("property_access.type", "in", allowed_types)
  if (active_organization_id) {
    // it's realtor's managed properties
    query = query.where(
      "property.realtor_id",
      "=",
      active_organization_id,
    )
  } else {
    // it's personal "freelance" managed properties
    query = query.where("property.realtor_id", "is", null)
  }
  const access = await query.executeTakeFirst()
  if (!access) error(403, "Forbidden")
  return access
}

export async function require_view_access(
  headers: Headers,
  user_id: number,
  property_id: number,
  active_organization_id: string | null | undefined,
) {
  return require_property_access(
    headers,
    user_id,
    property_id,
    [
      ACCESS_TYPE.LANDLORD,
      ACCESS_TYPE.MANAGER,
      ACCESS_TYPE.TENANT,
    ],
    active_organization_id,
    { property: ["read"] },
  )
}

export async function require_edit_access(
  headers: Headers,
  user_id: number,
  property_id: number,
  active_organization_id: string | null | undefined,
) {
  return require_property_access(
    headers,
    user_id,
    property_id,
    [ACCESS_TYPE.LANDLORD, ACCESS_TYPE.MANAGER],
    active_organization_id,
    { property: ["write"] },
  )
}

export async function require_landlord_access(
  headers: Headers,
  user_id: number,
  property_id: number,
  active_organization_id: string | null | undefined,
) {
  return require_property_access(
    headers,
    user_id,
    property_id,
    [ACCESS_TYPE.LANDLORD],
    active_organization_id,
    { property: ["read"] },
  )
}

export async function get_accessible_property_ids(
  user_id: number,
  types?: AccessType[],
  active_organization_id?: string | null,
) {
  let query = query_builder
    .selectFrom("property_access")
    .innerJoin(
      "property",
      "property.id",
      "property_access.property_id",
    )
    .select("property_access.property_id")
    .where("property_access.user_id", "=", user_id)
  if (types) {
    query = query.where("property_access.type", "in", types)
  }
  if (active_organization_id) {
    query = query.where(
      "property.realtor_id",
      "=",
      active_organization_id,
    )
  } else {
    query = query.where("property.realtor_id", "is", null)
  }
  const results = await query.execute()
  return results.map((r) => r.property_id)
}

export async function assign_property_access(
  property_id: number,
  user_id: number,
  type: AccessType,
  granted_by?: number,
) {
  const now = new Date()
  return query_builder
    .insertInto("property_access")
    .values({
      property_id,
      user_id,
      type,
      granted_by,
      created_at: now,
      updated_at: now,
    })
    .onConflict((oc) =>
      oc
        .columns(["property_id", "user_id", "type"])
        .doNothing(),
    )
    .execute()
}

export async function is_tenant_accessible(
  tenant_id: number,
  manager_property_ids: number[],
) {
  if (manager_property_ids.length === 0) return false
  const access = await query_builder
    .selectFrom("property_access")
    .where("user_id", "=", tenant_id)
    .where("type", "=", ACCESS_TYPE.TENANT)
    .where("property_id", "in", manager_property_ids)
    .select("id")
    .executeTakeFirst()
  return access !== undefined
}

export async function revoke_all_access_by_type(
  property_id: number,
  type: AccessType,
) {
  return query_builder
    .deleteFrom("property_access")
    .where("property_id", "=", property_id)
    .where("type", "=", type)
    .execute()
}
