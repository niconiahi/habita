export enum AccessRole {}

import * as v from "valibot";

export type ObjectValues<T> = T[keyof T];
export const ACCESS_TYPE = {
  OWNER: 0,
  ADMINISTRATOR: 1,
  TENANT: 2
} as const;
export const AccessTypeSchema = v.picklist(Object.values(ACCESS_TYPE));
export type AccessType = ObjectValues<typeof ACCESS_TYPE>;

export function get_access_type_label(type: number | AccessType) {
  const access_type = v.parse(AccessTypeSchema, type);
  switch (access_type) {
    case ACCESS_TYPE.OWNER: {
      return "Dueño";
    }
    case ACCESS_TYPE.TENANT: {
      return "Inquilino";
    }
    case ACCESS_TYPE.ADMINISTRATOR: {
      return "Administrador";
    }
    default: {
      const _exhaustive: never = access_type;
      return _exhaustive;
    }
  }
}

export function get_access_types() {
  return Object.values(ACCESS_TYPE);
}
