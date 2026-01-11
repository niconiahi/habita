import { PROPERTY_TYPE } from "$lib/property_type"
import type { Contract } from "../../../routes/admin/properties/[property_id]/contracts/[contract_id]/edit/fetchers/contract.server"
import type { Property } from "../../../routes/admin/properties/[property_id]/edit/fetchers/property.server"
import type { Owner } from "../owner"
import type { Tenant } from "../tenant"
type ValidationErrors = Record<string, string>
type ValidationResult =
  | { success: true; contract: Contract; property: Property; owner: NonNullable<Owner>; tenant: NonNullable<Tenant> }
  | { success: false; errors: ValidationErrors }
export function validate_contract_requirements(
  contract: Contract | undefined,
  property: Property | undefined,
  owner: Owner | null,
  tenant: Tenant | null,
): ValidationResult {
  const errors: ValidationErrors = {}
  if (!contract) {
    errors.contract = "El contrato no existe"
    return { success: false, errors }
  }
  if (!property) {
    errors.property = "La propiedad no existe"
    return { success: false, errors }
  }
  if (!owner) {
    errors.owner = "Falta asignar un propietario"
  } else {
    if (!owner.name) errors.owner_name = "Falta el nombre del propietario"
    if (!owner.surname) errors.owner_surname = "Falta el apellido del propietario"
    if (!owner.document_number) errors.owner_document_number = "Falta el DNI del propietario"
    if (!owner.email) errors.owner_email = "Falta el email del propietario"
    if (!owner.phone_number) errors.owner_phone_number = "Falta el teléfono del propietario"
  }
  if (!tenant) {
    errors.tenant = "Falta asignar un inquilino"
  } else {
    if (!tenant.name) errors.tenant_name = "Falta el nombre del inquilino"
    if (!tenant.surname) errors.tenant_surname = "Falta el apellido del inquilino"
    if (!tenant.document_number) errors.tenant_document_number = "Falta el DNI del inquilino"
    if (!tenant.email) errors.tenant_email = "Falta el email del inquilino"
    if (!tenant.phone_number) errors.tenant_phone_number = "Falta el teléfono del inquilino"
  }
  if (!contract.start_date) errors.start_date = "Falta la fecha de inicio"
  if (!contract.end_date) errors.end_date = "Falta la fecha de finalización"
  if (!contract.escalation_type) errors.escalation_type = "Falta el tipo de escalación"
  if (!contract.escalation_duration) errors.escalation_duration = "Falta la duración de escalación"
  if (contract.fine_amount === null || contract.fine_amount === undefined) {
    errors.fine_amount = "Falta el porcentaje de mora"
  }
  if (!contract.periods || contract.periods.length === 0) {
    errors.periods = "Falta definir al menos un período con precio"
  } else if (contract.periods[0].price === null || contract.periods[0].price === undefined) {
    errors.periods = "Falta el precio del primer período"
  }
  if (!property.location?.road) errors.property_road = "Falta la calle de la propiedad"
  if (!property.location?.house_number) errors.property_house_number = "Falta el número de la propiedad"
  if (!property.location?.state) errors.property_state = "Falta la provincia de la propiedad"
  if (property.type !== PROPERTY_TYPE.HOUSE && !property.unit) {
    errors.property_unit = "Falta la unidad de la propiedad"
  }
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  return { success: true, contract, property, owner: owner!, tenant: tenant! }
}
