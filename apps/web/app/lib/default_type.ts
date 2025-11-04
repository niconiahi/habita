import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const DEFAULT_TYPE = {
  FIXED: 0,
  PORCENTUAL: 1,
} as const
export const DefaultTypeSchema = v.picklist(
  Object.values(DEFAULT_TYPE),
)
export type DefaultType = ObjectValues<typeof DEFAULT_TYPE>

export function get_default_label(type: DefaultType) {
  switch (type) {
    case DEFAULT_TYPE.FIXED: {
      return "Fijo"
    }
    case DEFAULT_TYPE.PORCENTUAL: {
      return "Porcentual"
    }
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}
