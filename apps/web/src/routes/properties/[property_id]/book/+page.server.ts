import { trace } from "@opentelemetry/api"
import { sql } from "kysely"
import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceDateSchema } from "$lib/server/force_date"
import { ForceNumberSchema } from "$lib/force_number"
import { SLOT_STATE } from "$lib/slot_state"
import { logger } from "$lib/telemetry/logger"
import { query_builder } from "db/query_builder"
import { set_date } from "./actions/set_date.server"
import { update_slot } from "./actions/update_slot.server"
import { ACTION } from "./actions/action"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({
  params,
  locals,
  url,
}) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  const date = v.parse(
    v.union([ForceDateSchema, v.null()]),
    url.searchParams.get("date"),
  )
  const dates = await fetch_dates(property_id)
  const times = date
    ? await fetch_times(property_id, date)
    : []
  return { dates, times, user: locals.user }
}

export const actions: Actions = {
  [ACTION.SET_DATE]: async ({ request, params, url }) => {
    const tracer = trace.getTracer("web.action")
    return tracer.startActiveSpan(
      "/properties/:id/book/set_date",
      async (span) => {
        const form_data = await request.formData()
        const property_id = v.parse(
          ForceNumberSchema,
          params.property_id,
        )
        form_data.set("property_id", String(property_id))
        span.setAttribute("property.id", property_id)
        const [set_date_errors, set_date_data] =
          await set_date(url, form_data)
        if (set_date_errors) {
          span.end()
          return { errors: set_date_errors }
        }
        logger.info("date set successfully")
        span.end()
        redirect(302, set_date_data.redirect_to)
      },
    )
  },
  [ACTION.UPDATE_SLOT]: async ({ request, params }) => {
    const tracer = trace.getTracer("web.action")
    return tracer.startActiveSpan(
      "/properties/:id/book/update_slot",
      async (span) => {
        const form_data = await request.formData()
        const property_id = v.parse(
          ForceNumberSchema,
          params.property_id,
        )
        form_data.set("property_id", String(property_id))
        span.setAttribute("property.id", property_id)
        const [update_slot_errors] = await update_slot(
          form_data,
          span,
        )
        if (update_slot_errors) {
          span.end()
          return { errors: update_slot_errors }
        }
        logger.info("slot updated successfully")
        span.end()
        redirect(302, "..")
      },
    )
  },
}

function fetch_dates(property_id: number) {
  return query_builder
    .selectFrom("slot")
    .innerJoin(
      "property",
      "property.id",
      "slot.property_id",
    )
    .where((eb) =>
      eb.and([
        eb("property.id", "=", property_id),
        eb("slot.state", "=", SLOT_STATE.FREE),
      ]),
    )
    .select([sql<Date>`start_date::date`.as("date")])
    .groupBy("date")
    .orderBy("date")
    .execute()
}

function fetch_times(property_id: number, date: Date) {
  return query_builder
    .selectFrom("slot")
    .innerJoin(
      "property",
      "property.id",
      "slot.property_id",
    )
    .where((eb) =>
      eb.and([
        eb("property.id", "=", property_id),
        eb(sql<Date>`start_date::date`, "=", date),
        eb("slot.state", "=", SLOT_STATE.FREE),
      ]),
    )
    .select([
      "slot.id",
      "slot.start_date",
      "slot.end_date",
      "slot.state",
    ])
    .orderBy("slot.start_date")
    .execute()
}
