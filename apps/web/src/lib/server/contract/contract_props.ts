import type { Contract } from "../../../routes/admin/properties/[property_id]/contracts/[contract_id]/edit/fetchers/contract.server"
import type { Property } from "../../../routes/admin/properties/[property_id]/edit/fetchers/property.server"
import type { Warranty } from "../../../routes/admin/properties/[property_id]/contracts/[contract_id]/edit/fetchers/warranty.server"
import type { Landlord } from "../landlord"
import type { Tenant } from "../tenant"

export interface ContractProps {
  contract: Contract
  property: Property
  landlord: Landlord
  tenant: Tenant
  warranty: Warranty
}
