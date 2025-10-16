import * as dateFns from "date-fns"
import { renderToString } from "react-dom/server"
import * as v from "valibot"
import { generate_pdf_with_playwright } from "~/lib/server/pdf_generator"
import {
  DefaultTypeSchema,
  type DefaultType,
} from "~/lib/server/default_type"
import {
  DurationSchema,
  get_duration_label,
  type Duration,
} from "~/lib/server/duration"
import {
  EscalationTypeSchema,
  get_escalation_label,
} from "~/lib/server/escalation_type"
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
import { fetch_contract } from "../../fetchers/server/contract"

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
    const contract_id = v.parse(
      ForceNumberSchema,
      form_data.get("id"),
    )
    const contract = await fetch_contract(contract_id)
    const initial_price = v.parse(
      v.number(),
      contract.periods[0].price,
    )
    const start_date = v.parse(
      ForceDateSchema,
      form_data.get("start_date"),
    )
    const end_date = v.parse(
      ForceDateSchema,
      form_data.get("end_date"),
    )
    const escalation_type = v.parse(
      EscalationTypeSchema,
      Number(form_data.get("escalation_type")),
    )
    const escalation_duration = v.parse(
      DurationSchema,
      form_data.get("escalation_duration"),
    )
    const fine_type = v.parse(
      FineTypeSchema,
      Number(form_data.get("fine_type")),
    )
    const fine_amount = v.parse(
      ForceNumberSchema,
      form_data.get("fine_amount"),
    )
    const default_type = v.parse(
      DefaultTypeSchema,
      Number(form_data.get("default_type")),
    )
    const default_amount = v.parse(
      ForceNumberSchema,
      form_data.get("default_amount"),
    )
    console.log("default_amount", default_amount)
    const _owner = await fetch_owner(property_id)
    const owner = v.parse(SignatorySchema, _owner)
    console.log("owner", owner)
    const _tenant = await fetch_tenant(property_id)
    const tenant = v.parse(SignatorySchema, _tenant)
    console.log("tenant", tenant)
    const _default: Default = {
      type: default_type,
      amount: default_amount,
    }
    console.log("_default", _default)
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
      price: initial_price,
      location: {
        // TODO: house_number should be a number
        house_number: Number(
          property.location.house_number,
        ),
        road: property.location.road,
        state: property.location.state ?? "hola",
      },
      owner_location,
      services: property.services,
      escalation: {
        type: get_escalation_label(escalation_type),
        duration: get_duration_label(escalation_duration),
      },
      property: {
        unit: "3D",
      },
    }
    const html = renderToString(<Pdf {...props} />)
    const content = await generate_pdf_with_playwright(html)
    console.log("content", content)
    await query_builder
      .transaction()
      .execute(async (tx) => {
        const contract_file_ = await tx
          .selectFrom("contract_file")
          .select("file_id")
          .where((eb) =>
            eb.and([
              eb("type", "=", CONTRACT_FILE_TYPE.CONTRACT),
              eb("contract_id", "=", contract_id),
            ]),
          )
          .executeTakeFirst()
        if (contract_file_ !== undefined) {
          await tx
            .deleteFrom("file")
            .where("id", "=", contract_file_.file_id)
            .executeTakeFirstOrThrow()
        }
        const hash = Bun.CryptoHasher.hash(
          "sha256",
          content,
          "hex",
        )
        const file = await tx
          .insertInto("file")
          .values({
            content,
            mime: "application/pdf",
            basename: "contract.pdf",
            created_at: now,
            updated_at: now,
            hash: hash,
            size: content.byteLength,
          })
          .returning("id")
          .executeTakeFirstOrThrow()
        const contract_file = await tx
          .insertInto("contract_file")
          .values({
            file_id: file.id,
            type: CONTRACT_FILE_TYPE.CONTRACT,
            contract_id: contract_id,
            created_at: now,
            updated_at: now,
          })
          .returning("id")
          .executeTakeFirstOrThrow()
        return contract_file
      })
    console.log("created")
    return new Response("success")
  } catch (error) {
    console.log("error", error.message)
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
