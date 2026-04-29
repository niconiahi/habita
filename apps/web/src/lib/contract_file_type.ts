import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const CONTRACT_FILE_TYPE = {
  CONTRACT: 0,
  SIGNED: 2,
} as const
export const ContractFileTypeSchema = v.picklist(
  Object.values(CONTRACT_FILE_TYPE),
)
export type ContractFileType = ObjectValues<
  typeof CONTRACT_FILE_TYPE
>

export function get_contract_file_type_label(
  type: number | ContractFileType,
) {
  const contract_file_type = v.parse(
    ContractFileTypeSchema,
    type,
  )
  switch (contract_file_type) {
    case CONTRACT_FILE_TYPE.CONTRACT: {
      return "Contrato"
    }
case CONTRACT_FILE_TYPE.SIGNED: {
      return "Contrato firmado"
    }
    default: {
      const _exhaustive: never = contract_file_type
      return _exhaustive
    }
  }
}

export function get_contract_file_types() {
  return Object.values(CONTRACT_FILE_TYPE)
}
