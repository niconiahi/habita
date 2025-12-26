import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const PROPERTY_DESTINY = {
  RESIDENTIAL: 0,
  COMMERCIAL: 1,
} as const
export const PropertyDestinySchema = v.picklist(
  Object.values(PROPERTY_DESTINY),
)
export type PropertyDestiny = ObjectValues<
  typeof PROPERTY_DESTINY
>

export function get_property_destiny_label(type: number) {
  const property_destiny = v.parse(
    PropertyDestinySchema,
    type,
  )
  switch (property_destiny) {
    case PROPERTY_DESTINY.RESIDENTIAL: {
      return "Vivienda"
    }
    case PROPERTY_DESTINY.COMMERCIAL: {
      return "Comercial"
    }
    default: {
      const _exhaustive: never = property_destiny
      return _exhaustive
    }
  }
}
export function get_property_destinies() {
  return Object.values(PROPERTY_DESTINY)
}
