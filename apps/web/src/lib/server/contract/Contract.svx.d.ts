import type { Component } from "svelte"
import type { Contract as ContractType } from "../../../routes/admin/properties/[property_id]/contracts/[contract_id]/edit/fetchers/contract.server"
import type { Property } from "../../../routes/admin/properties/[property_id]/edit/fetchers/property.server"
import type { Owner } from "../owner"
import type { Tenant } from "../tenant"

declare const Contract: Component<{
  contract: ContractType
  property: Property
  owner: Owner
  tenant: Tenant
}>
export default Contract
