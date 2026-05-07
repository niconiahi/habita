import { error } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { SUBSCRIPTION_TYPE } from "$lib/subscription_type"

export type OrganizationRole =
  | "landlord"
  | "realtor"
  | "manager"
  | "tenant"

export function require_active_realtor_organization(
  active_organization_id: string | null,
  subscriptions: App.Locals["subscriptions"],
): { id: string } {
  if (!active_organization_id) {
    error(403, "No hay organización activa")
  }
  const subscription = subscriptions.find(
    (s) => s.organization_id === active_organization_id,
  )
  if (subscription?.type !== SUBSCRIPTION_TYPE.REALTOR) {
    error(403, "La organización activa no es una inmobiliaria")
  }
  return { id: active_organization_id }
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

export async function get_user_organization(
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
    .where("member.role", "in", ["realtor", "manager"])
    .select([
      "organization.id",
      "organization.name",
      "member.role",
    ])
    .executeTakeFirst()
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

export async function get_user_selectable_organizations(
  user_id: number,
) {
  return query_builder
    .selectFrom("member")
    .innerJoin(
      "organization",
      "organization.id",
      "member.organization_id",
    )
    .innerJoin(
      "subscription",
      "subscription.organization_id",
      "member.organization_id",
    )
    .where("member.user_id", "=", user_id)
    .select([
      "organization.id",
      "organization.name",
      "organization.logo",
      "member.role",
      "subscription.type as subscription_type",
    ])
    .execute()
}

export type SelectableOrganization = Awaited<
  ReturnType<typeof get_user_selectable_organizations>
>[number]

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
