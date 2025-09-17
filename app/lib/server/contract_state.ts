import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const CONTRACT_STATE = {
  INACTIVE: 0,
  ACTIVE: 1,
  FINISHED: 2,
} as const
export const ContractStateSchema = v.picklist(
  Object.values(CONTRACT_STATE),
)
export type ContractState = ObjectValues<
  typeof CONTRACT_STATE
>

export function get_contract_state_label(
  type: ContractState,
) {
  switch (type) {
    case CONTRACT_STATE.ACTIVE: {
      return "Activo"
    }
    case CONTRACT_STATE.FINISHED: {
      return "Terminado"
    }
    case CONTRACT_STATE.INACTIVE: {
      return "Inactivo"
    }
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}
