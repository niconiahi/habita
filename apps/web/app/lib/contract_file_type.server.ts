import * as v from "valibot"
import {
  CONTRACT_FILE_TYPE,
  get_contract_file_type_label,
  type ContractFileType,
  type ObjectValues,
} from "./contract_file_type"

export const ContractFileTypeSchema = v.picklist(
  Object.values(CONTRACT_FILE_TYPE),
)

export function get_contract_file_types() {
  return Object.values(CONTRACT_FILE_TYPE)
}

export {
  CONTRACT_FILE_TYPE,
  get_contract_file_type_label,
  type ContractFileType,
  type ObjectValues,
}
