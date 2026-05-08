import { tz } from "@date-fns/tz"
import { parse } from "date-fns"
import * as v from "valibot"
import { error, invalid } from "@sveltejs/kit"
import { form } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { now } from "$lib/server/now"
import { require_contract_edit_access_remote } from "$lib/server/auth/require_contract_edit_access_remote"
import { logger } from "$lib/telemetry/logger"

const ARGENTINA_TIMEZONE = "America/Argentina/Buenos_Aires"
const INPUT_FORMAT = "yyyy-MM-dd'T'HH:mm"

export const update_contract_term = form(
  v.object({
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
    start_date: v.string(),
    end_date: v.string(),
  }),
  async (input, issue) => {
    const start_date = parse(
      input.start_date,
      INPUT_FORMAT,
      new Date(),
      { in: tz(ARGENTINA_TIMEZONE) },
    )
    const end_date = parse(
      input.end_date,
      INPUT_FORMAT,
      new Date(),
      { in: tz(ARGENTINA_TIMEZONE) },
    )
    const issues = []
    if (start_date.getTime() <= Date.now())
      issues.push(issue.start_date("La fecha debe ser futura"))
    if (end_date.getTime() <= Date.now())
      issues.push(issue.end_date("La fecha debe ser futura"))
    if (end_date.getTime() <= start_date.getTime())
      issues.push(
        issue.end_date(
          "La fecha de finalización debe ser posterior a la de inicio",
        ),
      )
    if (issues.length > 0) invalid(...issues)

    await require_contract_edit_access_remote(input)
    try {
      await query_builder
        .updateTable("contract")
        .set({
          start_date,
          end_date,
          updated_at: now,
        })
        .where("contract.id", "=", input.contract_id)
        .execute()
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          { contract_id: input.contract_id },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al actualizar el plazo")
    }
  },
)
