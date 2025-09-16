import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const FINE_TYPE = {
  FIXED: 0,
  PORCENTUAL: 1,
} as const
export const FineTypeSchema = v.picklist(
  Object.values(FINE_TYPE),
)
export type FineType = ObjectValues<typeof FINE_TYPE>

export function get_fine_formula(type: FineType) {
  switch (type) {
    case FINE_TYPE.FIXED: {
      return "fine + fixed_amount"
    }
    case FINE_TYPE.PORCENTUAL: {
      return "fine + (price * percentage)"
    }
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export function get_fine_label(type: FineType) {
  switch (type) {
    case FINE_TYPE.FIXED: {
      return "Fijo"
    }
    case FINE_TYPE.PORCENTUAL: {
      return "Porcentual"
    }
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}
