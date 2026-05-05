import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { fail } from "@sveltejs/kit"
import { display_location } from "$lib/display_location"
import { ForceNumberSchema } from "$lib/force_number"
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
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const { id } = input_validation.output

  let slot: {
    start_date: Date
    end_date: Date
    visitant_id: number | null
    property_id: number
  }
  try {
    slot = await query_builder
      .selectFrom("slot")
      .where("slot.id", "=", id)
      .where("slot.state", "=", SLOT_STATE.RESERVED)
      .select([
        "slot.start_date",
        "slot.end_date",
        "slot.visitant_id",
        "slot.property_id",
      ])
      .executeTakeFirstOrThrow()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { slot_id: id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "No se pudo rechazar el turno",
    })
  }

  try {
    await query_builder
      .updateTable("slot")
      .set({
        state: SLOT_STATE.FREE,
        visitant_id: null,
      })
      .where("slot.id", "=", id)
      .where("slot.state", "=", SLOT_STATE.RESERVED)
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { slot_id: id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "No se pudo rechazar el turno",
    })
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
    return fail(400, {
      message: "No se encontró la propiedad",
    })
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
}
