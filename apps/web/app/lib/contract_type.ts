import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const CONTRACT_TYPE = {
  SHORT_TERM: 0,
  LONG_TERM: 1,
} as const
export const ContractTypeSchema = v.picklist(
  Object.values(CONTRACT_TYPE),
)
export type ContractType = ObjectValues<
  typeof CONTRACT_TYPE
>

export function get_contract_type_label(
  type: number | ContractType,
) {
  const contract_type = v.parse(ContractTypeSchema, type)
  switch (contract_type) {
    case CONTRACT_TYPE.SHORT_TERM: {
      return "corto plazo"
    }
    case CONTRACT_TYPE.LONG_TERM: {
      return "largo plazo"
    }
    default: {
      const _exhaustive: never = contract_type
      return _exhaustive
    }
  }
}

export function get_contract_types() {
  return Object.values(CONTRACT_TYPE)
}
