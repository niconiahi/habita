import type { DefaultType } from "$lib/default_type"
import type { Duration } from "$lib/duration"
import type { FineType } from "$lib/fine_type"
export type Fine = {
  type: FineType
  amount: number
  duration: Duration
}
export type Default = {
  type: DefaultType
  amount: number
}
export type Signatory = {
  name: string
  surname: string
  phone_number: string
  document_number: number
}
export type Location = {
  state: string
  road: string
  house_number: number
}
export type Service = {
  id: number
  type: number
  code: string
}
export type Escalation = {
  type: string
  duration: string
}
export type ContractProps = {
  end_date: string
  start_date: string
  owner: Signatory
  fine: Fine
  default: Default
  tenant: Signatory
  owner_location: Location
  location: Location
  escalation: Escalation
  price: number
  property: {
    unit: string
  }
  services: Service[]
}
