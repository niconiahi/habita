import { error } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { auth } from "./auth"
import { ACCESS_TYPE, type AccessType } from "$lib/access_type"

export async function require_property_access(
	headers: Headers,
	user_id: number,
	property_id: number,
	allowed_types: AccessType[],
) {
	// Layer 1: Role-based permission check (Better Auth)
	const permission: { property: ("read" | "write")[] } = allowed_types.includes(ACCESS_TYPE.TENANT)
		? { property: ["read"] }
		: { property: ["write"] }
	const can_access = await auth.api.hasPermission({
		headers,
		body: { permissions: permission },
	})
	if (!can_access) error(403, "Forbidden")
	// Layer 2: Property-specific assignment check (ACL table)
	const access = await query_builder
		.selectFrom("property_access")
		.where("property_id", "=", property_id)
		.where("user_id", "=", user_id)
		.where("type", "in", allowed_types)
		.executeTakeFirst()
	if (!access) error(403, "Forbidden")
	return access
}

export async function require_view_access(
	headers: Headers,
	user_id: number,
	property_id: number,
) {
	return require_property_access(headers, user_id, property_id, [
		ACCESS_TYPE.LANDLORD,
		ACCESS_TYPE.MANAGER,
		ACCESS_TYPE.TENANT,
	])
}

export async function require_edit_access(
	headers: Headers,
	user_id: number,
	property_id: number,
) {
	return require_property_access(headers, user_id, property_id, [
		ACCESS_TYPE.LANDLORD,
		ACCESS_TYPE.MANAGER,
	])
}

export async function require_landlord_access(
	headers: Headers,
	user_id: number,
	property_id: number,
) {
	return require_property_access(headers, user_id, property_id, [
		ACCESS_TYPE.LANDLORD,
	])
}

export async function get_accessible_property_ids(
	user_id: number,
	types?: AccessType[],
) {
	let query = query_builder
		.selectFrom("property_access")
		.select("property_id")
		.where("user_id", "=", user_id)
	if (types) {
		query = query.where("type", "in", types)
	}
	const results = await query.execute()
	return results.map((r) => r.property_id)
}

export async function get_property_users(property_id: number, type?: AccessType) {
	let query = query_builder
		.selectFrom("property_access")
		.innerJoin("user", "user.id", "property_access.user_id")
		.select(["user.id", "user.name", "user.email", "property_access.type"])
		.where("property_access.property_id", "=", property_id)
	if (type !== undefined) {
		query = query.where("property_access.type", "=", type)
	}
	return query.execute()
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
			oc.columns(["property_id", "user_id", "type"]).doNothing(),
		)
		.execute()
}

export async function revoke_property_access(
	property_id: number,
	user_id: number,
	type?: AccessType,
) {
	let query = query_builder
		.deleteFrom("property_access")
		.where("property_id", "=", property_id)
		.where("user_id", "=", user_id)
	if (type !== undefined) {
		query = query.where("type", "=", type)
	}
	return query.execute()
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
	return !!access
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
