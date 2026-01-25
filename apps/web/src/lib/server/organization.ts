import { query_builder } from "db/query_builder"

export type OrganizationRole =
  | "landlord"
  | "realtor"
  | "manager"
  | "tenant"

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
      .updateTable("property")
      .set({ organization_id })
      .where("id", "=", property_id)
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
  const property = await query_builder
    .selectFrom("property")
    .where("id", "=", property_id)
    .select("organization_id")
    .executeTakeFirst()
  if (!property?.organization_id)
    throw new Error(`No organization for property ${property_id}`)
  const now = new Date()
  const member_id = crypto.randomUUID()
  await query_builder
    .insertInto("member")
    .values({
      id: member_id,
      organization_id: property.organization_id,
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
  const property = await query_builder
    .selectFrom("property")
    .where("id", "=", property_id)
    .select("organization_id")
    .executeTakeFirst()
  if (!property?.organization_id) return
  await query_builder
    .deleteFrom("member")
    .where("organization_id", "=", property.organization_id)
    .where("role", "=", role)
    .execute()
}

export async function get_property_organization(
  property_id: number,
) {
  return query_builder
    .selectFrom("property")
    .innerJoin(
      "organization",
      "property.organization_id",
      "organization.id",
    )
    .where("property.id", "=", property_id)
    .select([
      "organization.id",
      "organization.name",
      "organization.slug",
      "organization.logo",
      "organization.created_at",
      "organization.updated_at",
    ])
    .executeTakeFirst()
}

export async function get_user_property_memberships(
  user_id: number,
) {
  return query_builder
    .selectFrom("member")
    .innerJoin(
      "property",
      "member.organization_id",
      "property.organization_id",
    )
    .where("member.user_id", "=", user_id)
    .select(["member.role", "property.id as property_id"])
    .execute()
}

export async function get_user_realtor_organization(
  user_id: number,
) {
  return query_builder
    .selectFrom("member")
    .innerJoin(
      "organization",
      "organization.id",
      "member.organization_id",
    )
    .where("member.user_id", "=", user_id)
    .where("member.role", "=", "realtor")
    .select([
      "organization.id",
      "organization.name",
      "organization.slug",
      "organization.logo",
    ])
    .executeTakeFirst()
}

export async function get_user_organization(user_id: number) {
  return query_builder
    .selectFrom("member")
    .innerJoin(
      "organization",
      "organization.id",
      "member.organization_id",
    )
    .where("member.user_id", "=", user_id)
    .where("member.role", "in", ["realtor", "manager"])
    .select([
      "organization.id",
      "organization.name",
      "member.role",
    ])
    .executeTakeFirst()
}

export async function get_organization_property_ids(
  organization_id: string,
) {
  const properties = await query_builder
    .selectFrom("property")
    .where("organization_id", "=", organization_id)
    .select("id as property_id")
    .execute()
  return properties.map((p) => p.property_id)
}

export async function is_realtor(user_id: number) {
  const membership = await query_builder
    .selectFrom("member")
    .where("user_id", "=", user_id)
    .where("role", "=", "realtor")
    .select("id")
    .executeTakeFirst()
  return !!membership
}

export async function get_organization_managers(
  organization_id: string,
) {
  return query_builder
    .selectFrom("member")
    .innerJoin("user", "user.id", "member.user_id")
    .where("member.organization_id", "=", organization_id)
    .where("member.role", "=", "manager")
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.email",
      "member.created_at",
    ])
    .execute()
}

export async function link_property_to_organization(
  property_id: number,
  organization_id: string,
) {
  await query_builder
    .updateTable("property")
    .set({
      organization_id,
      updated_at: new Date(),
    })
    .where("id", "=", property_id)
    .execute()
}
