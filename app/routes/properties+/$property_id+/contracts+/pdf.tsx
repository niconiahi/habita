import * as dateFns from "date-fns"
import { chromium } from "playwright"
import { renderToString } from "react-dom/server"
import {
  DurationSchema,
  type Duration,
} from "~/lib/server/duration"
import {
  FineTypeSchema,
  type FineType,
} from "~/lib/server/fine_type"
import Contract from "../../../../../mdx/contract.mdx"
import type { Route } from "./+types/pdf"
import { ForceDateSchema } from "~/lib/server/force_date"
import * as v from "valibot"
import { ForceNumberSchema } from "~/lib/server/force_number"
import { query_builder } from "db/query_builder"

export type Props = {
  end_date: string
  start_date: string
  duration: string
  owner: {
    name: string
    surname: string
    phone_number: number
    document_number: number
  }
  fine: {
    type: FineType
    amount: number
    duration: Duration
  }
  default: {
    type: FineType
    amount: number
  }
  tenant: {
    name: string
    surname: string
    phone_number: number
    document_number: number
  }
  owner_location: {
    state: string
    road: string
    house_number: number
  }
  location: {
    state: string
    road: string
    house_number: number
  }
  property: {
    unit: string
    floor: number
  }
}

const FineSchema = v.object({
  duration: DurationSchema,
  amount: v.number(),
  type: FineTypeSchema,
})
const DefaultSchema = v.object({
  amount: v.number(),
  type: FineTypeSchema,
})

function Pdf(props: Props) {
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

export async function action({
  request,
}: Route.ActionArgs) {
  const form_data = await request.formData()
  const end_date = v.parse(
    ForceDateSchema,
    form_data.get("end_date"),
  )
  const start_date = v.parse(
    ForceDateSchema,
    form_data.get("start_date"),
  )
  const fine = v.parse(FineSchema, form_data.get("fine"))
  const default_ = v.parse(
    DefaultSchema,
    form_data.get("default"),
  )
  const owner_id = v.parse(
    ForceNumberSchema,
    form_data.get("owner_id"),
  )
  const tenant_id = v.parse(
    ForceNumberSchema,
    form_data.get("tenant_id"),
  )
  const owner = fetch_owner(owner_id)
  const tenant = fetch_tenant(tenant_id)
  const props: Props = {
    end_date: end_date.toISOString(),
    start_date: start_date.toISOString(),
    duration: `${dateFns.differenceInMonths(
      end_date,
      start_date,
    )} meses`,
    fine,
    default: default_,
    owner,
    tenant,
    location,
    owner_location,
    property: {
      unit: "D",
      floor: 3,
    },
  }
  const html = renderToString(<Pdf {...props} />)
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle" })
  const pdf_buffer = await page.pdf({
    format: "A4",
    printBackground: true,
  })
  await browser.close()
  return new Response(Uint8Array.from(pdf_buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="invoice.pdf"',
    },
  })
}

async function fetch_tenant(id: number) {
  return query_builder
    .selectFrom("user")
    .where("user.id", "=", id)
    .select([
      "user.name",
      "user.surname",
      "user.phone_number",
      "user.document_number",
    ])
    .executeTakeFirstOrThrow()
}
