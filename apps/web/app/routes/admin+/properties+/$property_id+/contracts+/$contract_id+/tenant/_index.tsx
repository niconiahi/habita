import { startOfMonth, subMonths } from "date-fns"
import { Form } from "react-router"
import * as v from "valibot"
import { Button } from "~/components/button"
import { Content } from "~/components/content"
import { Section } from "~/components/section"
import { ACCESS_TYPE } from "~/lib/access_type"
import { require_auth } from "~/lib/auth.server"
import { display_date } from "~/lib/display_date"
import { error } from "~/lib/error.server"
import { ForceNumberSchema } from "~/lib/force_number"
import {
  get_property_accesses,
  has_tenant_access,
} from "~/lib/property_access.server"
import { query_builder } from "~/lib/query_builder.server"
import {
  get_receipt_type_label,
  get_receipt_types,
  RECEIPT_TYPE,
} from "~/lib/receipt_type"
import { fetch_property } from "~/routes/properties+/fetchers/property.server"
import { fetch_contract } from "../edit/fetchers/contract.server"
import type { Route } from "./+types/_index"
import * as actions from "./actions/index.server"

const INTENT = {
  UPLOAD_RECEIPT: "upload_receipt",
} as const

export async function action({
  request,
  params,
}: Route.ActionArgs) {
  const { user } = await require_auth(request)
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
    {
      message: "property id should be a number",
    },
  )
  const has_tenant_access = user.accesses.some(
    (access) =>
      access.property_id === property_id &&
      access.type === ACCESS_TYPE.TENANT,
  )
  if (!has_tenant_access) {
    throw error(403, "not found")
  }
  const form_data = await request.formData()
  const intent = form_data.get("intent")
  if (!intent) {
    throw error(400, "intent is required")
  }
  switch (intent) {
    case INTENT.UPLOAD_RECEIPT: {
      try {
        await actions.upload_receipt.execute(form_data)
        return null
      } catch (error) {
        if (error instanceof v.ValiError) {
          return {
            errors: {
              upload_receipt:
                actions.upload_receipt.get_errors(error),
            },
          }
        }
        throw error
      }
    }
  }
  return null
}

export async function loader({
  request,
  params,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
    {
      message: "property id should be a number",
    },
  )
  const contract_id = v.parse(
    ForceNumberSchema,
    params.contract_id,
    {
      message: "contract id should be a number",
    },
  )
  const property_accesses = get_property_accesses(
    user,
    property_id,
  )
  if (!has_tenant_access(property_accesses)) {
    throw error(403, "not found")
  }
  const contract = await fetch_contract(contract_id)
  const property = await fetch_property(property_id)
  if (!property) {
    throw error(400, "not found")
  }
  const latest_period = contract.periods.sort((a, b) => {
    const b_start_date = v.parse(v.string(), b.start_date)
    const a_start_date = v.parse(v.string(), a.start_date)
    return (
      new Date(b_start_date).getTime() -
      new Date(a_start_date).getTime()
    )
  })[0]
  const two_months_ago = startOfMonth(
    subMonths(new Date(), 2),
  )
  const receipts = await query_builder
    .selectFrom("receipt")
    .innerJoin("file", "file.id", "receipt.file_id")
    .where("receipt.contract_id", "=", contract_id)
    .where("receipt.created_at", ">=", two_months_ago)
    .select([
      "receipt.id",
      "receipt.type",
      "receipt.created_at",
      "file.id as file_id",
      "file.basename",
      "file.hash",
    ])
    .execute()
  const date = new Date()
  const dates = [date, subMonths(date, 1)]
  const receipt_types = get_receipt_types().filter(
    (type) => {
      if (type === RECEIPT_TYPE.RENT) {
        return true
      }
      const property_service_types = property.services.map(
        (service) => service.type,
      )
      return property_service_types.includes(type)
    },
  )
  return {
    dates,
    receipt_types,
    contract,
    receipts,
    current_rent_price: latest_period.price,
  }
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const {
    contract,
    receipts,
    receipt_types,
    dates,
    current_rent_price,
  } = loaderData
  return (
    <Content.Root>
      <Content.Title>Comprobantes de pago</Content.Title>
      <Content.Section>
        <Section.Header>
          <Section.Title>
            Precio de alquiler actual
          </Section.Title>
        </Section.Header>
        <p>${current_rent_price}</p>
      </Content.Section>
      {dates.map((date) => (
        <Content.Section key={date.toISOString()}>
          <Section.Header>
            <Section.Title>
              {display_date(date, {
                month: "long",
                year: "numeric",
              })}
            </Section.Title>
          </Section.Header>
          <ul>
            {receipt_types.map((type) => {
              const receipt =
                get_receipt_for_month_and_type(
                  date,
                  type,
                  receipts,
                )
              const label = get_receipt_type_label(type)
              return (
                <li key={type}>
                  <span>{label}</span>
                  {receipt ? (
                    <a
                      href={`/files/${receipt.file_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Descargar
                    </a>
                  ) : (
                    <Form
                      method="post"
                      encType="multipart/form-data"
                    >
                      <input
                        type="hidden"
                        name="intent"
                        value={INTENT.UPLOAD_RECEIPT}
                      />
                      <input
                        type="hidden"
                        name="contract_id"
                        value={contract.id}
                      />
                      <input
                        type="hidden"
                        name="type"
                        value={type}
                      />
                      <input
                        type="file"
                        name="file"
                        required
                        accept="image/*,application/pdf"
                      />
                      <Button type="submit">Subir</Button>
                    </Form>
                  )}
                </li>
              )
            })}
          </ul>
        </Content.Section>
      ))}
    </Content.Root>
  )
}

function get_receipt_for_month_and_type(
  date: Date,
  type: number,
  receipts: Route.ComponentProps["loaderData"]["receipts"],
) {
  return receipts.find((receipt) => {
    const creation_date = startOfMonth(
      new Date(receipt.created_at),
    )
    const current_date = startOfMonth(date)
    return (
      receipt.type === type &&
      creation_date.getTime() === current_date.getTime()
    )
  })
}
