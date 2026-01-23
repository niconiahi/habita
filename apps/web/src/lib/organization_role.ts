import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const ORGANIZATION_ROLE = {
  OWNER: "owner",
  REALTOR: "realtor",
  ADMIN: "admin",
  TENANT: "tenant",
} as const
export const OrganizationRoleSchema = v.picklist(
  Object.values(ORGANIZATION_ROLE),
)
export type OrganizationRole = ObjectValues<
  typeof ORGANIZATION_ROLE
>

export function get_role_label(
  role: string | OrganizationRole,
): string {
  const organization_role = v.parse(
    OrganizationRoleSchema,
    role,
  )
  switch (organization_role) {
    case ORGANIZATION_ROLE.OWNER: {
      return "Dueño"
    }
    case ORGANIZATION_ROLE.REALTOR: {
      return "Inmobiliaria"
    }
    case ORGANIZATION_ROLE.ADMIN: {
      return "Administrador"
    }
    case ORGANIZATION_ROLE.TENANT: {
      return "Inquilino"
    }
    default: {
      const _exhaustive: never = organization_role
      return _exhaustive
    }
  }
}
