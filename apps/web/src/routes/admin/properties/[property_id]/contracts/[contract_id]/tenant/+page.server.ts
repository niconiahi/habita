import { redirect, error } from "@sveltejs/kit"
import { startOfMonth, subMonths } from "date-fns"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import {
  RECEIPT_TYPE,
  get_receipt_types,
} from "$lib/receipt_type"
import { query_builder } from "db/query_builder"
import {
  get_property_accesses,
  has_tenant_access,
} from "$lib/server/property_access"
import { fetch_contract } from "../edit/fetchers/contract.server"
import { fetch_property } from "../../../../../../properties/fetchers/property.server"
import type { PageServerLoad, Actions } from "./$types"
import { ACTION } from "./actions/action"
import { upload_receipt } from "./actions/upload_receipt.server"

export const load: PageServerLoad = async ({
  locals,
  params,
}) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
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
    locals.user,
    property_id,
  )
  if (!has_tenant_access(property_accesses)) {
    error(404, "not found")
  }
  const [contract, property] = await Promise.all([
    fetch_contract(contract_id),
    fetch_property(property_id),
  ])
  if (!contract) {
    error(
      404,
      `contract does not exist for id ${contract_id}`,
    )
  }
  if (!property) {
    error(400, "not found")
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
    current_rent_price: latest_period?.price ?? 0,
  }
}

export const actions: Actions = {
  [ACTION.UPLOAD_RECEIPT]: async ({
    request,
    locals,
    params,
  }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
      {
        message: "property id should be a number",
      },
    )
    const property_accesses = get_property_accesses(
      locals.user,
      property_id,
    )
    if (!has_tenant_access(property_accesses)) {
      error(403, "not found")
    }
    const form_data = await request.formData()
    await upload_receipt(form_data)
    return null
  },
}
