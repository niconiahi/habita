import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const CONTRACT_FILE_TYPE = {
  CONTRACT: 0,
  INSURANCE: 1,
  CREDIT_REPORT: 2,
} as const
export const ContractFileTypeSchema = v.picklist(
  Object.values(CONTRACT_FILE_TYPE),
)
export type ContractFileType = ObjectValues<
  typeof CONTRACT_FILE_TYPE
>

export function get_contract_file_type_label(
  type: ContractFileType,
) {
  switch (type) {
    case CONTRACT_FILE_TYPE.CONTRACT: {
      return "Contrato"
    }
    case CONTRACT_FILE_TYPE.INSURANCE: {
      return "Seguro"
    }
    case CONTRACT_FILE_TYPE.CREDIT_REPORT: {
      return "Informe crediticio"
    }
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}
