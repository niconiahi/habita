import type { Component } from "svelte"
import type { Contract as ContractType } from "../../../routes/admin/properties/[property_id]/contracts/[contract_id]/edit/fetchers/contract.server"
import type { Property } from "../../../routes/admin/properties/[property_id]/edit/fetchers/property.server"
import type { Landlord } from "../landlord"
import type { Tenant } from "../tenant"

declare const Contract: Component<{
  contract: ContractType
  property: Property
  landlord: Landlord
  tenant: Tenant
}>
export default Contract
