import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { display_location } from "$lib/display_location"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { publish_send_slot_rejected_alert } from "$lib/server/broker/producer/publish_send_slot_rejected_alert"
import { decrypt } from "$lib/server/encryption"
import { normalize_input } from "$lib/server/form"
import { SLOT_STATE } from "$lib/slot_state"
import { logger } from "$lib/telemetry/logger"
import { fetch_property } from "../../../../../../properties/fetchers/property.server"

const InputSchema = v.object({
  id: ForceNumberSchema,
})

export async function reject_slot(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        reject_slot: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const { id } = input_validation.output

  const [fetch_error, slot] = await safe_async(
    query_builder
      .selectFrom("slot")
      .where("slot.id", "=", id)
      .where("slot.state", "=", SLOT_STATE.RESERVED)
      .select([
        "slot.start_date",
        "slot.end_date",
        "slot.visitant_id",
        "slot.property_id",
      ])
      .executeTakeFirstOrThrow(),
  )
  if (fetch_error) {
    logger.error(
      fetch_error.message,
      { slot_id: id },
      fetch_error,
    )
    return [
      {
        reject_slot: {
          execution: "No se pudo rechazar el turno",
        },
      },
      null,
    ] as const
  }

  const [update_error] = await safe_async(
    query_builder
      .updateTable("slot")
      .set({
        state: SLOT_STATE.FREE,
        visitant_id: null,
      })
      .where("slot.id", "=", id)
      .where("slot.state", "=", SLOT_STATE.RESERVED)
      .execute(),
  )
  if (update_error) {
    logger.error(
      update_error.message,
      { slot_id: id },
      update_error,
    )
    return [
      {
        reject_slot: {
          execution: "No se pudo rechazar el turno",
        },
      },
      null,
    ] as const
  }

  const visitant_row = await query_builder
    .selectFrom("user")
    .select(["email", "name"])
    .where("id", "=", slot.visitant_id)
    .executeTakeFirstOrThrow()

  const property = await fetch_property(slot.property_id)
  if (!property) {
    logger.error("property not found", {
      property_id: slot.property_id,
    })
    return [
      {
        reject_slot: {
          execution: "No se encontró la propiedad",
        },
      },
      null,
    ] as const
  }

  await publish_send_slot_rejected_alert(id, {
    visitant_email: visitant_row.email,
    visitant_name: decrypt(visitant_row.name),
    property_address: display_location(property.location),
    start_date: slot.start_date.toISOString(),
    end_date: slot.end_date.toISOString(),
  })

  logger.info("slot rejected by admin", {
    slot_id: id,
    property_id: slot.property_id,
    visitant_id: slot.visitant_id,
  })

  return [null, null] as const
}
