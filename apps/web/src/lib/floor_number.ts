import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]

export const FLOOR_NUMBER = {
  SECOND_BASEMENT: -2,
  FIRST_BASEMENT: -1,
  GROUND: 0,
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
  FOURTH: 4,
  FIFTH: 5,
} as const

export const FloorNumberSchema = v.picklist(
  Object.values(FLOOR_NUMBER),
)

export type FloorNumber = ObjectValues<typeof FLOOR_NUMBER>

export function display_floor_number(
  number: number | FloorNumber,
): string {
  const floor_number = v.parse(FloorNumberSchema, number)
  switch (floor_number) {
    case FLOOR_NUMBER.SECOND_BASEMENT: {
      return "Segundo Subsuelo"
    }
    case FLOOR_NUMBER.FIRST_BASEMENT: {
      return "Primer Subsuelo"
    }
    case FLOOR_NUMBER.GROUND: {
      return "Planta Baja"
    }
    case FLOOR_NUMBER.FIRST: {
      return "1°"
    }
    case FLOOR_NUMBER.SECOND: {
      return "2°"
    }
    case FLOOR_NUMBER.THIRD: {
      return "3°"
    }
    case FLOOR_NUMBER.FOURTH: {
      return "4°"
    }
    case FLOOR_NUMBER.FIFTH: {
      return "5°"
    }
    default: {
      const _exhaustive: never = floor_number
      return _exhaustive
    }
  }
}

export function get_floor_numbers() {
  return Object.values(FLOOR_NUMBER)
}
