import * as v from "valibot";

export type ObjectValues<T> = T[keyof T];
export const PROPERTY_STATE = {
  EDITING: 0,
  PUBLISHED: 1,
  RENTED: 2,
} as const;
export const PropertyStateSchema = v.picklist(Object.values(PROPERTY_STATE));
export type PropertyState = ObjectValues<typeof PROPERTY_STATE>;

export function get_property_state_label(type: number | PropertyState) {
  const property_state = v.parse(PropertyStateSchema, type);
  switch (property_state) {
    case PROPERTY_STATE.EDITING: {
      return "En edicion";
    }
    case PROPERTY_STATE.PUBLISHED: {
      return "Publicada";
    }
    case PROPERTY_STATE.RENTED: {
      return "Alquilada";
    }
    default: {
      const _exhaustive: never = property_state;
      return _exhaustive;
    }
  }
}

export function get_property_states() {
  return Object.values(PROPERTY_STATE);
}
