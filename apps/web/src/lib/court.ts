import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const COURT = {
  CIUDAD_DE_BUENOS_AIRES: 0,
  LOMAS_DE_ZAMORA: 1,
} as const
export const CourtSchema = v.picklist(Object.values(COURT))
export type Court = ObjectValues<typeof COURT>

export function get_court_label(type: number | Court) {
  const court = v.parse(CourtSchema, type)
  switch (court) {
    case COURT.CIUDAD_DE_BUENOS_AIRES: {
      return "Ciudad de Buenos Aires"
    }
    case COURT.LOMAS_DE_ZAMORA: {
      return "Lomas de Zamora"
    }
    default: {
      const _exhaustive: never = court
      return _exhaustive
    }
  }
}

export function get_courts() {
  return Object.values(COURT)
}
