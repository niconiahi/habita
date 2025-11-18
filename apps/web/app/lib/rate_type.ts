import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const RATE_TYPE = {
  IPC: 0,
  ICL: 1,
  CASA_PROPIA: 2,
  CAC: 3,
  CER: 4,
  IS: 5,
  IPIM: 6,
  UVA: 7,
} as const
export const RateTypeSchema = v.picklist(
  Object.values(RATE_TYPE),
)
export type RateType = ObjectValues<typeof RATE_TYPE>

export function get_rate_label(type: number | RateType) {
  const rate_type = v.parse(RateTypeSchema, type)
  switch (rate_type) {
    case RATE_TYPE.IPC: {
      return "IPC"
    }
    case RATE_TYPE.ICL: {
      return "ICL"
    }
    case RATE_TYPE.CASA_PROPIA: {
      return "Casa Propia"
    }
    case RATE_TYPE.CAC: {
      return "CAC"
    }
    case RATE_TYPE.CER: {
      return "CER"
    }
    case RATE_TYPE.IS: {
      return "IS"
    }
    case RATE_TYPE.IPIM: {
      return "IPIM"
    }
    case RATE_TYPE.UVA: {
      return "UVA"
    }
    default: {
      const _exhaustive: never = rate_type
      return _exhaustive
    }
  }
}

export function get_rate_type_label(type: RateType) {
  switch (type) {
    case RATE_TYPE.IPC: {
      return "IPC"
    }
    case RATE_TYPE.ICL: {
      return "ICL"
    }
    case RATE_TYPE.CASA_PROPIA: {
      return "CasaPropia"
    }
    case RATE_TYPE.CAC: {
      return "CAC"
    }
    case RATE_TYPE.CER: {
      return "CER"
    }
    case RATE_TYPE.IS: {
      return "IS"
    }
    case RATE_TYPE.IPIM: {
      return "IPIM"
    }
    case RATE_TYPE.UVA: {
      return "UVA"
    }
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export function get_rate_types() {
  return Object.values(RATE_TYPE)
}
