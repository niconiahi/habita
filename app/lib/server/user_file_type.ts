import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const USER_FILE_TYPE = {
  CREDIT_REPORT: 0,
} as const
export const UserFileTypeSchema = v.picklist(
  Object.values(USER_FILE_TYPE),
)
export type UserFileType = ObjectValues<
  typeof USER_FILE_TYPE
>

export function get_user_file_type_label(
  type: UserFileType,
) {
  switch (type) {
    case USER_FILE_TYPE.CREDIT_REPORT: {
      return "Informe crediticio"
    }
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}
