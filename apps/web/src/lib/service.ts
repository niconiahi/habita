import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const SERVICE_TYPE = {
  MUNICIPAL_FEE: 0,
  WATER: 1,
  LIGHT: 2,
  GAS: 3,
} as const
export const ServiceTypeSchema = v.picklist(
  Object.values(SERVICE_TYPE),
)
export type ServiceType = ObjectValues<typeof SERVICE_TYPE>

export function get_service_type_label(type: ServiceType) {
  switch (type) {
    case SERVICE_TYPE.MUNICIPAL_FEE: {
      return "ABL"
    }
    case SERVICE_TYPE.WATER: {
      return "Agua"
    }
    case SERVICE_TYPE.LIGHT: {
      return "Luz"
    }
    case SERVICE_TYPE.GAS: {
      return "Gas"
    }
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export function get_service_types() {
  return Object.values(SERVICE_TYPE)
}
