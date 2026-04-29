import { require_authentication } from "$lib/server/auth"
import { startOfMonth, subMonths } from "date-fns"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { CONTRACT_STATE } from "$lib/contract_state"
import { ForceNumberSchema } from "$lib/force_number"
import {
  get_receipt_types,
  RECEIPT_TYPE,
} from "$lib/receipt_type"
import { require_property_access } from "$lib/server/property_access"
import { fetch_property } from "../../../../../properties/fetchers/property.server"
import { error } from "@sveltejs/kit"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { upload_receipt } from "./actions/upload_receipt.server"

const HISTORY_PAGE_SIZE = 6

function get_date_string(date: Date) {
  return date.toISOString().slice(0, 10)
}

export const load: PageServerLoad = async ({
  request,
  locals,
  params,
  url,
}) => {
  require_authentication(locals, url)
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
    {
      message: "property id should be a number",
    },
  )
  const property = await fetch_property(property_id)
  if (!property) {
    error(404, "Propiedad no encontrada")
  }
  const contract = property.contracts.find(
    (contract) =>
      contract.state === CONTRACT_STATE.ACTIVE,
  )
  if (!contract) {
    error(
      404,
      "No se encontró un contrato activo para esta propiedad",
    )
  }

  const now = new Date()
  const current_month = startOfMonth(now)
  const day_param = url.searchParams.get("day")
  const history_anchor = day_param
    ? startOfMonth(new Date(day_param))
    : null

  const history_dates: Date[] = []
  if (history_anchor) {
    for (let index = 0; index < HISTORY_PAGE_SIZE; index++) {
      const month = subMonths(history_anchor, index)
      if (month.getTime() >= current_month.getTime()) {
        continue
      }
      history_dates.push(month)
    }
  }

  const dates = [now, ...history_dates]
  const oldest_visible = history_dates.length > 0
    ? history_dates[history_dates.length - 1]
    : current_month

  const receipts = await query_builder
    .selectFrom("receipt")
    .innerJoin("file", "file.id", "receipt.file_id")
    .where("receipt.contract_id", "=", contract.id)
    .where(
      "receipt.created_at",
      ">=",
      startOfMonth(oldest_visible),
    )
    .select([
      "receipt.id",
      "receipt.type",
      "receipt.created_at",
      "file.id as file_id",
      "file.basename",
      "file.hash",
    ])
    .execute()
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
  const contract_start = contract.start_date
    ? startOfMonth(new Date(contract.start_date))
    : null
  let next_day: string | null = null
  if (
    contract_start &&
    oldest_visible.getTime() > contract_start.getTime()
  ) {
    const next_anchor = subMonths(oldest_visible, 1)
    next_day = get_date_string(
      next_anchor.getTime() < contract_start.getTime()
        ? contract_start
        : next_anchor,
    )
  }
  return {
    dates,
    receipt_types,
    contract,
    receipts,
    next_day,
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
