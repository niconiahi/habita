import * as v from "valibot";

export type ObjectValues<T> = T[keyof T];
export const ESCALATION_TYPE = {
  IPC: 0,
  ICL: 1
} as const;
export const EscalationTypeSchema = v.picklist(Object.values(ESCALATION_TYPE));
export type EscalationType = ObjectValues<typeof ESCALATION_TYPE>;

export function get_escalation_formula(type: number | EscalationType) {
  const escalation_type = v.parse(EscalationTypeSchema, type);
  switch (escalation_type) {
    case ESCALATION_TYPE.IPC: {
      return "price * (ipc_current_month / ipc_four_months_ago)";
    }
    case ESCALATION_TYPE.ICL: {
      return "price * (icl_current_month / icl_four_months_ago)";
    }
    default: {
      const _exhaustive: never = escalation_type;
      return _exhaustive;
    }
  }
}

export function get_escalation_label(type: number | EscalationType) {
  const escalation_type = v.parse(EscalationTypeSchema, type);
  switch (escalation_type) {
    case ESCALATION_TYPE.IPC: {
      return "IPC";
    }
    case ESCALATION_TYPE.ICL: {
      return "ICL";
    }
    default: {
      const _exhaustive: never = escalation_type;
      return _exhaustive;
    }
  }
}

export function get_escalation_types() {
  return Object.values(ESCALATION_TYPE);
}
