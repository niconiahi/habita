import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const PROPERTY_FILE_TYPE = {
  PHOTO: 0,
} as const
export const PropertyFileTypeSchema = v.picklist(
  Object.values(PROPERTY_FILE_TYPE),
)
export type PropertyFileType = ObjectValues<
  typeof PROPERTY_FILE_TYPE
>

export function get_property_file_type_label(
  type: PropertyFileType,
) {
  switch (type) {
    case PROPERTY_FILE_TYPE.PHOTO: {
      return "Foto"
    }
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}
