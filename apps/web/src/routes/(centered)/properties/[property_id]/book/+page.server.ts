import { trace } from "@opentelemetry/api"
import { redirect } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { SLOT_STATE } from "$lib/slot_state"
import { logger } from "$lib/telemetry/logger"
import { USER_FILE_TYPE } from "$lib/user_file_type"
import { fetch_user_files } from "../../../../properties/fetchers/user_files.server"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { update_slot } from "./actions/update_slot.server"

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
  const [slots, user_files] = await Promise.all([
    fetch_free_slots(property_id),
    fetch_user_files(locals.user.id),
  ])
  const has_credit_report = user_files.some(
    (file) => file.type === USER_FILE_TYPE.CREDIT_REPORT,
  )
  const date = url.searchParams.get("date")
  if (!date && slots.length > 0) {
    const first_date = slots[0].start_date
      .toISOString()
      .split("T")[0]
    url.searchParams.set("date", first_date)
    redirect(302, url.pathname + "?" + url.searchParams.toString())
  }
  return { slots, date, user: locals.user, has_credit_report }
}

export const actions: Actions = {
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
        const date = form_data.get("date")
        logger.info("slot updated successfully")
        span.end()
        redirect(
          302,
          `/book/success?date=${encodeURIComponent(String(date))}`,
        )
      },
    )
  },
}

function fetch_free_slots(property_id: number) {
  return query_builder
    .selectFrom("slot")
    .where("slot.property_id", "=", property_id)
    .where("slot.state", "=", SLOT_STATE.FREE)
    .where("slot.visitant_id", "is", null)
    .select([
      "slot.id",
      "slot.start_date",
      "slot.end_date",
    ])
    .orderBy("slot.start_date", "asc")
    .execute()
}
