import * as v from "valibot"

export const ROOM_TYPE = {
  BEDROOM: 0,
  BATHROOM: 1,
  KITCHEN: 2,
  LIVING_ROOM: 3,
  DINING_ROOM: 4,
} as const

export const RoomTypeSchema = v.picklist(
  Object.values(ROOM_TYPE),
)

export type RoomType = v.InferOutput<typeof RoomTypeSchema>

export function display_room_type(room_type: RoomType) {
  switch (room_type) {
    case ROOM_TYPE.BEDROOM: {
      return "Dormitorio"
    }
    case ROOM_TYPE.KITCHEN: {
      return "Cocina"
    }
    case ROOM_TYPE.BATHROOM: {
      return "Baño"
    }
    case ROOM_TYPE.DINING_ROOM: {
      return "Comedor"
    }
    case ROOM_TYPE.LIVING_ROOM: {
      return "Living"
    }
  }
}
