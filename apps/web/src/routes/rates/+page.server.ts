import { require_authentication } from "$lib/server/auth"
import { error, redirect } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import {
  get_rate_types,
  RateTypeSchema,
} from "$lib/rate_type"
import { is_webmaster } from "$lib/server/is_webmaster"
import { now } from "$lib/server/now"
import type { Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  require_authentication(locals)
  if (!is_webmaster(locals.user)) {
    error(403, "forbidden")
  }
  const current_date = new Date()
  const current_month = current_date.getMonth() + 1
  const current_year = current_date.getFullYear()
  const rates = await query_builder
    .selectFrom("rate")
    .selectAll()
    .where("month", "=", current_month)
    .where("year", "=", current_year)
    .execute()
  const rate_types = get_rate_types()
  return {
    current_month,
    current_year,
    rates,
    rate_types,
  }
}

export const actions: Actions = {
  default: async ({ request, locals }) => {
    require_authentication(locals)
    if (!is_webmaster(locals.user)) {
      error(403, "forbidden")
    }
    const form_data = await request.formData()
    const rate_type = v.parse(
      v.pipe(ForceNumberSchema, RateTypeSchema),
      form_data.get("type"),
    )
    const month = v.parse(
      ForceNumberSchema,
      form_data.get("month"),
    )
    const year = v.parse(
      ForceNumberSchema,
      form_data.get("year"),
    )
    const value = v.parse(
      v.string(),
      form_data.get("value"),
    )
    await query_builder
      .insertInto("rate")
      .values({
        type: rate_type,
        month,
        year,
        value,
        created_at: now,
        updated_at: now,
      })
      .onConflict((oc) =>
        oc
          .constraint("rate_type_month_year_unique")
          .doUpdateSet({
            value,
            updated_at: now,
          }),
      )
      .execute()
    return null
  },
}
