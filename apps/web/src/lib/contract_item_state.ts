import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const CONTRACT_ITEM_STATE = {
  GOOD: 0,
  DEFECTIVE: 1,
} as const
export const ContractItemStateSchema = v.picklist(
  Object.values(CONTRACT_ITEM_STATE),
)
export type ContractItemState = ObjectValues<
  typeof CONTRACT_ITEM_STATE
>

export function get_contract_item_state_label(
  type: number | ContractItemState,
) {
  const contract_item_state = v.parse(ContractItemStateSchema, type)
  switch (contract_item_state) {
    case CONTRACT_ITEM_STATE.GOOD: {
      return "Bueno"
    }
    case CONTRACT_ITEM_STATE.DEFECTIVE: {
      return "Defectuoso"
    }
    default: {
      const _exhaustive: never = contract_item_state
      return _exhaustive
    }
  }
}

export function get_contract_item_states() {
  return Object.values(CONTRACT_ITEM_STATE)
}
