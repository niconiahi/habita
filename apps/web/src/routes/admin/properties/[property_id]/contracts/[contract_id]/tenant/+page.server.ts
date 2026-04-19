import { require_authentication } from "$lib/server/auth"
import { error, redirect } from "@sveltejs/kit"
import { startOfMonth, subMonths } from "date-fns"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import {
  get_receipt_types,
  RECEIPT_TYPE,
} from "$lib/receipt_type"
import { require_property_access } from "$lib/server/property_access"
import { fetch_property } from "../../../../../../properties/fetchers/property.server"
import { fetch_contract } from "../edit/fetchers/contract.server"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { upload_receipt } from "./actions/upload_receipt.server"

export const load: PageServerLoad = async ({
  request,
  locals,
  params,
}) => {
  require_authentication(locals)
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
  await require_property_access(
    request.headers,
    locals.user.id,
    property_id,
    [ACCESS_TYPE.TENANT],
    locals.session.activeOrganizationId,
    { property: ["read"] },
  )
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
    require_authentication(locals)
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
      {
        message: "property id should be a number",
      },
    )
    await require_property_access(
      request.headers,
      locals.user.id,
      property_id,
      [ACCESS_TYPE.TENANT],
      locals.session.activeOrganizationId,
      { property: ["read"] },
    )
    const form_data = await request.formData()
    const [upload_receipt_errors] =
      await upload_receipt(form_data)
    if (upload_receipt_errors) {
      return { errors: upload_receipt_errors }
    }
    return null
  },
}
