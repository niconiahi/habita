import * as v from "valibot"
import { compose_types, type ObjectValues } from "./compose_types"
import { SERVICE_TYPE } from "./service"

export const RECEIPT_TYPE = compose_types(SERVICE_TYPE, {
  RENT: 0,
} as const)

export const ReceiptTypeSchema = v.picklist(
  Object.values(RECEIPT_TYPE),
)

export type ReceiptType = ObjectValues<typeof RECEIPT_TYPE>

export function get_receipt_type_label(type: ReceiptType) {
  switch (type) {
    case RECEIPT_TYPE.MUNICIPAL_FEE: {
      return "ABL"
    }
    case RECEIPT_TYPE.WATER: {
      return "Agua"
    }
    case RECEIPT_TYPE.LIGHT: {
      return "Luz"
    }
    case RECEIPT_TYPE.GAS: {
      return "Gas"
    }
    case RECEIPT_TYPE.RENT: {
      return "Alquiler"
    }
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export function get_receipt_types() {
  return Object.values(RECEIPT_TYPE)
}
