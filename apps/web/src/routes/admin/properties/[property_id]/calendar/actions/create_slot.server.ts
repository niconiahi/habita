import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { ForceNumberSchema } from "$lib/force_number"
import { SLOT_STATE } from "$lib/slot_state"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  property_id: ForceNumberSchema,
  host_id: ForceNumberSchema,
  date: v.pipe(v.string(), v.nonEmpty()),
  start_time: v.pipe(v.string(), v.nonEmpty()),
  end_time: v.pipe(v.string(), v.nonEmpty()),
})

export async function create_slot(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        create_slot: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [start_hours, start_minutes] = input.start_time
    .split(":")
    .map(Number)
  const [end_hours, end_minutes] = input.end_time
    .split(":")
    .map(Number)

  const start_date = new Date(input.date)
  start_date.setHours(start_hours, start_minutes, 0, 0)

  const end_date = new Date(input.date)
  end_date.setHours(end_hours, end_minutes, 0, 0)

  const now = new Date()

  const [error] = await safe_async(
    query_builder
      .insertInto("slot")
      .values({
        property_id: input.property_id,
        host_id: input.host_id,
        state: SLOT_STATE.FREE,
        event_id: crypto.randomUUID(),
        start_date,
        end_date,
        created_at: now,
        updated_at: now,
      })
      .execute(),
  )
  if (error) {
    logger.error(error.message, { property_id: input.property_id, host_id: input.host_id, date: input.date }, error)
    return [
      {
        create_slot: {
          execution: "Error al crear el turno",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
