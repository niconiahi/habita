import * as v from "valibot";

export type ObjectValues<T> = T[keyof T];
export const ROOM_TYPE = {
  BEDROOM: 0,
  BATHROOM: 1,
  KITCHEN: 2,
  LIVING_ROOM: 3,
  DINING_ROOM: 4
} as const;
export const RoomTypeSchema = v.picklist(Object.values(ROOM_TYPE));
export type RoomType = ObjectValues<typeof ROOM_TYPE>;

export function display_room_type(type: number | RoomType) {
  const room_type = v.parse(RoomTypeSchema, type);
  switch (room_type) {
    case ROOM_TYPE.BEDROOM: {
      return "Dormitorio";
    }
    case ROOM_TYPE.KITCHEN: {
      return "Cocina";
    }
    case ROOM_TYPE.BATHROOM: {
      return "Baño";
    }
    case ROOM_TYPE.DINING_ROOM: {
      return "Comedor";
    }
    case ROOM_TYPE.LIVING_ROOM: {
      return "Living";
    }
    default: {
      const _exhaustive: never = room_type;
      return _exhaustive;
    }
  }
}

export function get_room_types() {
  return Object.values(ROOM_TYPE);
}
