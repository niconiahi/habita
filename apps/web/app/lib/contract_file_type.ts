export type ObjectValues<T> = T[keyof T]

export const CONTRACT_FILE_TYPE = {
  CONTRACT: 0,
  INSURANCE: 1,
} as const

export type ContractFileType = ObjectValues<typeof CONTRACT_FILE_TYPE>

export function get_contract_file_type_label(type: number | ContractFileType) {
  switch (type) {
    case CONTRACT_FILE_TYPE.CONTRACT: {
      return "Contrato"
    }
    case CONTRACT_FILE_TYPE.INSURANCE: {
      return "Seguro"
    }
    default: {
      throw new Error(`Unknown contract file type: ${type}`)
    }
  }
}
