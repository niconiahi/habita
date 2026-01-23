import { query_builder } from "db/query_builder"

export type OrganizationRole = "owner" | "admin" | "tenant"

export async function create_property_organization(
  property_id: number,
  address: string,
  user_id: number,
  role: OrganizationRole,
) {
  const now = new Date()
  const organization_id = crypto.randomUUID()
  const member_id = crypto.randomUUID()
  await query_builder.transaction().execute(async (tx) => {
    await tx
      .insertInto("organization")
      .values({
        id: organization_id,
        name: `Property: ${address}`,
        slug: `property-${property_id}`,
        created_at: now,
        updated_at: now,
      })
      .execute()
    await tx
      .insertInto("property_organization")
      .values({
        property_id,
        organization_id,
        created_at: now,
        updated_at: now,
      })
      .execute()
    await tx
      .insertInto("member")
      .values({
        id: member_id,
        organization_id,
        user_id,
        role,
        created_at: now,
        updated_at: now,
      })
      .execute()
  })
  return { organization_id }
}

export async function add_user_to_property(
  property_id: number,
  user_id: number,
  role: OrganizationRole,
) {
  const property_organization =
    await get_property_organization(property_id)
  if (!property_organization)
    throw new Error(
      `No organization for property ${property_id}`,
    )
  const now = new Date()
  const member_id = crypto.randomUUID()
  await query_builder
    .insertInto("member")
    .values({
      id: member_id,
      organization_id:
        property_organization.organization_id,
      user_id,
      role,
      created_at: now,
      updated_at: now,
    })
    .execute()
}

export async function remove_user_role_from_property(
  property_id: number,
  role: OrganizationRole,
) {
  const property_organization =
    await get_property_organization(property_id)
  if (!property_organization) return
  await query_builder
    .deleteFrom("member")
    .where(
      "organization_id",
      "=",
      property_organization.organization_id,
    )
    .where("role", "=", role)
    .execute()
}

export async function get_property_organization(
  property_id: number,
) {
  return query_builder
    .selectFrom("property_organization")
    .innerJoin(
      "organization",
      "property_organization.organization_id",
      "organization.id",
    )
    .where(
      "property_organization.property_id",
      "=",
      property_id,
    )
    .selectAll()
    .executeTakeFirst()
}

export async function get_user_property_memberships(
  user_id: number,
) {
  return query_builder
    .selectFrom("member")
    .innerJoin(
      "property_organization",
      "member.organization_id",
      "property_organization.organization_id",
    )
    .where("member.user_id", "=", user_id)
    .select([
      "member.role",
      "property_organization.property_id",
    ])
    .execute()
}

export async function get_admin_property_ids(
  user_id: number,
) {
  const memberships = await query_builder
    .selectFrom("member")
    .innerJoin(
      "property_organization",
      "member.organization_id",
      "property_organization.organization_id",
    )
    .where("member.user_id", "=", user_id)
    .where("member.role", "=", "admin")
    .select("property_organization.property_id")
    .execute()
  return memberships.map((m) => m.property_id)
}

export async function get_edit_property_ids(
  user_id: number,
) {
  const memberships = await query_builder
    .selectFrom("member")
    .innerJoin(
      "property_organization",
      "member.organization_id",
      "property_organization.organization_id",
    )
    .where("member.user_id", "=", user_id)
    .where("member.role", "in", ["owner", "admin"])
    .select("property_organization.property_id")
    .execute()
  return memberships.map((m) => m.property_id)
}

export async function is_tenant_in_admin_properties(
  tenant_id: number,
  admin_property_ids: number[],
) {
  if (admin_property_ids.length === 0) return false
  const membership = await query_builder
    .selectFrom("member")
    .innerJoin(
      "property_organization",
      "member.organization_id",
      "property_organization.organization_id",
    )
    .where("member.user_id", "=", tenant_id)
    .where("member.role", "=", "tenant")
    .where(
      "property_organization.property_id",
      "in",
      admin_property_ids,
    )
    .select("member.id")
    .executeTakeFirst()
  return !!membership
}

export async function has_property_role(
  user_id: number,
  property_id: number,
  roles: OrganizationRole[],
) {
  const membership = await query_builder
    .selectFrom("member")
    .innerJoin(
      "property_organization",
      "member.organization_id",
      "property_organization.organization_id",
    )
    .where("member.user_id", "=", user_id)
    .where(
      "property_organization.property_id",
      "=",
      property_id,
    )
    .where("member.role", "in", roles)
    .selectAll()
    .executeTakeFirst()
  return !!membership
}
