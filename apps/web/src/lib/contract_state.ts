import * as v from "valibot";

export type ObjectValues<T> = T[keyof T];
export const CONTRACT_STATE = {
  EDITING: 0,
  ACTIVE: 1,
  FINISHED: 2
} as const;
export const ContractStateSchema = v.picklist(Object.values(CONTRACT_STATE));
export type ContractState = ObjectValues<typeof CONTRACT_STATE>;

export function get_contract_state_label(type: number | ContractState) {
  const contract_state = v.parse(ContractStateSchema, type);
  switch (contract_state) {
    case CONTRACT_STATE.EDITING: {
      return "En edición";
    }
    case CONTRACT_STATE.ACTIVE: {
      return "Activo";
    }
    case CONTRACT_STATE.FINISHED: {
      return "Finalizado";
    }
    default: {
      const _exhaustive: never = contract_state;
      return _exhaustive;
    }
  }
}

export function get_contract_states() {
  return Object.values(CONTRACT_STATE);
}
