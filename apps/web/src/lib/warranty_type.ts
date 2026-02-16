import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const WARRANTY_TYPE = {
  PROPERTY: "property",
  INCOME: "income",
  SURETY: "surety",
} as const
export const WarrantyTypeSchema = v.picklist(
  Object.values(WARRANTY_TYPE),
)
export type WarrantyType = ObjectValues<
  typeof WARRANTY_TYPE
>

export function get_warranty_type_label(
  type: string | WarrantyType,
) {
  const warranty_type = v.parse(WarrantyTypeSchema, type)
  switch (warranty_type) {
    case WARRANTY_TYPE.PROPERTY: {
      return "Garantía Propietaria"
    }
    case WARRANTY_TYPE.INCOME: {
      return "Recibo de Sueldo + Informe Comercial"
    }
    case WARRANTY_TYPE.SURETY: {
      return "Seguro de Caución"
    }
    default: {
      const _exhaustive: never = warranty_type
      return _exhaustive
    }
  }
}

export function get_warranty_types() {
  return Object.values(WARRANTY_TYPE)
}
