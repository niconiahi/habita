import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const ACCESS_TYPE = {
  LANDLORD: 0,
  MANAGER: 1,
  TENANT: 2,
} as const
export const AccessTypeSchema = v.picklist(
  Object.values(ACCESS_TYPE),
)
export type AccessType = ObjectValues<typeof ACCESS_TYPE>

export function get_access_label(
  type: number | AccessType,
) {
  const access_type = v.parse(AccessTypeSchema, type)
  switch (access_type) {
    case ACCESS_TYPE.LANDLORD:
      return "Propietario"
    case ACCESS_TYPE.MANAGER:
      return "Administrador"
    case ACCESS_TYPE.TENANT:
      return "Inquilino"
    default: {
      const _exhaustive: never = access_type
      return _exhaustive
    }
  }
}

export function get_access_types() {
  return Object.values(ACCESS_TYPE)
}
