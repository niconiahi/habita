import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const SLOT_STATE = {
  FREE: 0,
  RESERVED: 1,
  CANCELLED: 2,
} as const
export const SlotStateSchema = v.picklist(
  Object.values(SLOT_STATE),
)
export type SlotState = ObjectValues<typeof SLOT_STATE>

export function get_slot_state_label(
  type: number | SlotState,
) {
  const slot_state = v.parse(SlotStateSchema, type)
  switch (slot_state) {
    case SLOT_STATE.FREE: {
      return "Libre"
    }
    case SLOT_STATE.RESERVED: {
      return "Reservado"
    }
    case SLOT_STATE.CANCELLED: {
      return "Cancelado"
    }
    default: {
      const _exhaustive: never = slot_state
      return _exhaustive
    }
  }
}

export function get_slot_states() {
  return Object.values(SLOT_STATE)
}
