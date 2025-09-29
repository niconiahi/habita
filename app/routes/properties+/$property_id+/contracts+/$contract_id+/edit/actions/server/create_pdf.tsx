import * as dateFns from "date-fns"
import { renderToString } from "react-dom/server"
import { chromium } from "playwright"
import * as v from "valibot"
import {
  DefaultTypeSchema,
  type DefaultType,
} from "~/lib/server/default_type"
import {
  DurationSchema,
  type Duration,
} from "~/lib/server/duration"
import { EscalationTypeSchema } from "~/lib/server/escalation_type"
import {
  FineTypeSchema,
  type FineType,
} from "~/lib/server/fine_type"
import { ForceNumberSchema } from "~/lib/server/force_number"
import { fetch_owner } from "~/lib/server/owner"
import { fetch_tenant } from "~/lib/server/tenant"
import Contract from "../../../../../../../../../mdx/contract.mdx"
import { ForceDateSchema } from "~/lib/server/force_date"
import { fetch_property } from "~/routes/properties+/fetchers/server/property"
import { query_builder } from "db/query_builder"
import { now } from "~/lib/now"
import { CONTRACT_FILE_TYPE } from "~/lib/server/contract_file_type"

export async function create_pdf(
  form_data: FormData,
  property_id: number,
) {
  try {
    const property = await fetch_property(property_id)
    if (!property) {
      throw new Error(
        "property should exist when creating pdf",
      )
    }
    console.log("property", property)
    const id = v.parse(
      ForceNumberSchema,
      form_data.get("id"),
    )
    console.log("id", id)
    const start_date = v.parse(
      ForceDateSchema,
      form_data.get("start_date"),
    )
    console.log("start_date", start_date)
    const end_date = v.parse(
      ForceDateSchema,
      form_data.get("end_date"),
    )
    console.log("end_date", end_date)
    const duration = v.parse(
      v.string(),
      form_data.get("duration"),
    )
    console.log("duration", duration)
    const formula = v.parse(
      v.string(),
      form_data.get("formula"),
    )
    console.log("formula", formula)
    const escalation_type = v.parse(
      EscalationTypeSchema,
      Number(form_data.get("escalation_type")),
    )
    console.log("escalation_type", escalation_type)
    const escalation_duration = v.parse(
      DurationSchema,
      form_data.get("escalation_duration"),
    )
    console.log("escalation_duration", escalation_duration)
    const fine_type = v.parse(
      FineTypeSchema,
      Number(form_data.get("fine_type")),
    )
    console.log("fine_type", fine_type)
    const fine_amount = v.parse(
      ForceNumberSchema,
      form_data.get("fine_amount"),
    )
    console.log("fine_amount", fine_amount)
    const default_type = v.parse(
      DefaultTypeSchema,
      Number(form_data.get("default_type")),
    )
    console.log("default_type", default_type)
    const default_amount = v.parse(
      ForceNumberSchema,
      form_data.get("default_amount"),
    )
    console.log("default_amount", default_amount)
    const default_duration = v.parse(
      DurationSchema,
      form_data.get("default_duration"),
    )
    console.log("default_duration", default_duration)
    const _owner = await fetch_owner(property_id)
    console.log("_owner", _owner)
    const owner = v.parse(SignatorySchema, _owner)
    console.log("owner", owner)
    const _tenant = await fetch_tenant(property_id)
    console.log("_tenant", _tenant)
    const tenant = v.parse(SignatorySchema, _tenant)
    console.log("tenant", tenant)
    console.log("unit", property.unit)
    console.log("floor", property.floor)
    const _default: Default = {
      type: default_type,
      amount: default_amount,
    }
    const owner_location: {
      state: string
      road: string
      house_number: number
    } = {
      state: "Buenos Aires",
      road: "Boyaca",
      house_number: 882,
    }
    const fine: Fine = {
      type: fine_type,
      amount: fine_amount,
      duration: "D1D",
    }
    const props: Props = {
      end_date: end_date.toISOString(),
      start_date: start_date.toISOString(),
      duration: `${dateFns.differenceInMonths(
        end_date,
        start_date,
      )} meses`,
      fine,
      default: _default,
      owner,
      tenant,
      location: {
        // TODO: house_number should be a number
        house_number: Number(
          property.location.house_number,
        ),
        road: property.location.road,
        state: property.location.state ?? "hola",
      },
      owner_location,
      property: {
        unit: "D",
        floor: 3,
      },
    }
    console.log("props", props)
    const html = renderToString(<Pdf {...props} />)
    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.setContent(html, {
      waitUntil: "networkidle",
    })
    const pdf_buffer = await page.pdf({
      format: "A4",
      printBackground: true,
    })
    console.log("pdf_buffer", pdf_buffer)
    await browser.close()
    const pdf = new Blob([Uint8Array.from(pdf_buffer)], {
      type: "application/pdf",
    })
    const content = Buffer.from(await pdf.arrayBuffer())
    await query_builder
      .transaction()
      .execute(async (tx) => {
        const hash = Bun.CryptoHasher.hash(
          "sha256",
          content,
          "hex",
        )
        const file = await tx
          .insertInto("file")
          .values({
            content,
            mime: pdf.type,
            basename: "contract.pdf",
            created_at: now,
            updated_at: now,
            hash: hash,
            size: pdf.size,
          })
          .returning("id")
          .executeTakeFirstOrThrow()
        const contract_file = await tx
          .insertInto("contract_file")
          .values({
            file_id: file.id,
            user_id: 1,
            type: CONTRACT_FILE_TYPE.CONTRACT,
            contract_id: id,
            created_at: now,
            updated_at: now,
          })
          .returning("id")
          .executeTakeFirstOrThrow()
        return contract_file
      })
    return new Response("success")
  } catch (error) {
    console.error("Error in create_pdf:", error)
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
        stack:
          error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

type Fine = {
  type: FineType
  amount: number
  duration: Duration
}
type Default = {
  type: DefaultType
  amount: number
}
const SignatorySchema = v.object({
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

export type Props = {
  end_date: string
  start_date: string
  duration: string
  owner: Signatory
  fine: Fine
  default: Default
  tenant: Signatory
  owner_location: Location
  location: Location
  property: {
    unit: string
    floor: number
  }
}

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
