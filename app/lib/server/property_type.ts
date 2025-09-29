export enum AccessRole {}

import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const PROPERTY_TYPE = {
  DEPARTMENT: 0,
  HOUSE: 1,
} as const
export const PropertyTypeSchema = v.picklist(
  Object.values(PROPERTY_TYPE),
)
export type PropertyType = ObjectValues<
  typeof PROPERTY_TYPE
>

export function get_property_type_label(
  type: number | PropertyType,
) {
  const property_type = v.parse(PropertyTypeSchema, type)
  switch (property_type) {
    case PROPERTY_TYPE.DEPARTMENT: {
      return "Departamento"
    }
    case PROPERTY_TYPE.HOUSE: {
      return "Casa"
    }
    default: {
      const _exhaustive: never = property_type
      return _exhaustive
    }
  }
}
