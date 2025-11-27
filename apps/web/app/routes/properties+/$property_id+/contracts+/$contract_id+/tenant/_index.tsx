import { Form } from "react-router"
import * as v from "valibot"
import { subMonths, startOfMonth, format } from "date-fns"
import { require_auth } from "~/lib/auth.server"
import { error } from "~/lib/error.server"
import { ForceNumberSchema } from "~/lib/force_number"
import { ACCESS_TYPE } from "~/lib/access_type"
import { fetch_property } from "../../../../fetchers/server/property.server"
import { fetch_contract } from "../edit/fetchers/server/contract.server"
import { query_builder } from "~/lib/query_builder.server"
import {
  RECEIPT_TYPE,
  get_receipt_type_label,
  get_receipt_types,
} from "~/lib/receipt_type"
import type { Route } from "./+types/_index"
import * as actions from "./actions/index.server"
import {
  get_property_accesses,
  has_tenant_access,
} from "~/lib/property_access.server"

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
  }
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const { contract, receipts, receipt_types, dates } =
    loaderData
  return (
    <main>
      <h1>Comprobantes de pago</h1>
      {dates.map((date) => (
        <section key={date.toISOString()}>
          <h2>{format(date, "MMMM yyyy")}</h2>
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
                      <button type="submit">Subir</button>
                    </Form>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </main>
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
