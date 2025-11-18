export enum ContractType {
  SHORT_TERM = 0,
  LONG_TERM = 1,
}

export function get_contract_type_label(type: ContractType) {
  switch (type) {
    case ContractType.SHORT_TERM:
      return "corto plazo"
    case ContractType.LONG_TERM:
      return "largo plazo"
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export function get_contract_types() {
  return Object.values(ContractType).filter(
    (value) => typeof value === "number",
  ) as ContractType[]
}
