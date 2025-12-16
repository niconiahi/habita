import * as v from "valibot";

export type ObjectValues<T> = T[keyof T];
export const DEFAULT_TYPE = {
  FIXED: 0,
  PORCENTUAL: 1
} as const;
export const DefaultTypeSchema = v.picklist(Object.values(DEFAULT_TYPE));
export type DefaultType = ObjectValues<typeof DEFAULT_TYPE>;

export function get_default_label(type: number | DefaultType) {
  const default_type = v.parse(DefaultTypeSchema, type);
  switch (default_type) {
    case DEFAULT_TYPE.FIXED: {
      return "Fijo";
    }
    case DEFAULT_TYPE.PORCENTUAL: {
      return "Porcentual";
    }
    default: {
      const _exhaustive: never = default_type;
      return _exhaustive;
    }
  }
}

export function get_default_types() {
  return Object.values(DEFAULT_TYPE);
}
