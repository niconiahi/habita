import * as v from "valibot"
import Contract from "../../../mdx/contract.mdx"
import type { DefaultType } from "~/lib/default_type.server"
import type { Duration } from "~/lib/duration.server"
import type { FineType } from "~/lib/fine_type.server"

type Fine = {
  type: FineType
  amount: number
  duration: Duration
}
type Default = {
  type: DefaultType
  amount: number
}
export const SignatorySchema = v.object({
  name: v.string(),
  surname: v.string(),
  phone_number: v.string(),
  document_number: v.number(),
})
type Signatory = v.InferOutput<typeof SignatorySchema>
type Location = {
  state: string
  road: string
  house_number: number
}
type Service = {
  type: number
}
type Escalation = {
  type: string
  duration: string
}
export type Props = {
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

export function Pdf(props: Props) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <Contract {...props} />
      </body>
    </html>
  )
}
