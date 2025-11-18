export type ObjectValues<T> = T[keyof T]

export const PROPERTY_TYPE = {
  DEPARTMENT: 0,
  HOUSE: 1,
} as const

export type PropertyType = ObjectValues<typeof PROPERTY_TYPE>

export function get_property_type_label(type: number | PropertyType) {
  switch (type) {
    case PROPERTY_TYPE.DEPARTMENT: {
      return "Departamento"
    }
    case PROPERTY_TYPE.HOUSE: {
      return "Casa"
    }
    default: {
      throw new Error(`Unknown property type: ${type}`)
    }
  }
}
