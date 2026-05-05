import { fail } from "@sveltejs/kit"
import type { Span } from "@opentelemetry/api"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import type { PropertyVisitNotification } from "$lib/fetchers/notifications.schemas"
import { ForceNumberSchema } from "$lib/force_number"
import {
  compose_property_visit_href,
  NOTIFICATION_TYPE,
} from "$lib/notification_type"
import { display_location } from "$lib/display_location"
import { publish_send_slot_reserved_alert } from "$lib/server/broker/producer/publish_send_slot_reserved_alert"
import { decrypt } from "$lib/server/encryption"
import { normalize_input } from "$lib/server/form"
import {
  NOTIFICATION_EVENT,
  notification_emitter,
} from "$lib/server/notification_emitter"
import { SLOT_STATE } from "$lib/slot_state"
import { logger } from "$lib/telemetry/logger"
import { USER_FILE_TYPE } from "$lib/user_file_type"
import { fetch_property } from "../../../../../properties/fetchers/property.server"
import { fetch_user_files } from "../../../../../properties/fetchers/user_files.server"

export const InputSchema = v.object({
  id: ForceNumberSchema,
  visitant_id: ForceNumberSchema,
  property_id: ForceNumberSchema,
})

export async function update_slot(
  form_data: FormData,
  span: Span,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output
  const { visitant_id, id, property_id } = input

  const user_files = await fetch_user_files(visitant_id)
  const has_credit_report = user_files.some(
    (file) => file.type === USER_FILE_TYPE.CREDIT_REPORT,
  )
  if (!has_credit_report) {
    return fail(400, {
      message: "Se requiere un informe crediticio",
    })
  }

  span.setAttribute("slot.id", id)
  span.setAttribute("visitant.id", visitant_id)

  const notification_type = NOTIFICATION_TYPE.PROPERTY_VISIT
  let tx_result: Awaited<ReturnType<typeof execute_transaction>>
  async function execute_transaction() {
    return query_builder
      .transaction()
      .execute(async (tx) => {
        const slot = await tx
          .updateTable("slot")
          .set({
            visitant_id,
            state: SLOT_STATE.RESERVED,
          })
          .where("slot.id", "=", id)
          .where("slot.state", "=", SLOT_STATE.FREE)
          .returning([
            "slot.start_date",
            "slot.end_date",
            "slot.host_id",
            "slot.property_id",
            "slot.visitant_id",
          ])
          .executeTakeFirstOrThrow()
        const now = new Date()
        const notification = await tx
          .insertInto("notification")
          .values({
            type: notification_type,
            href: compose_property_visit_href(
              slot.property_id,
            ),
            property_id: slot.property_id,
            created_at: now,
            updated_at: now,
          })
          .returning([
            "notification.id",
            "notification.type",
            "notification.href",
            "notification.property_id",
            "notification.created_at",
          ])
          .executeTakeFirstOrThrow()
        return { slot, notification }
      })
  }
  try {
    tx_result = await execute_transaction()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { slot_id: id, visitant_id, property_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message:
        "El turno ya fue reservado por otro visitante",
    })
  }
  const { slot, notification } = tx_result

  span.setAttribute(
    "slot.start_date",
    slot.start_date.toISOString(),
  )
  span.setAttribute(
    "slot.end_date",
    slot.end_date.toISOString(),
  )
  span.setAttribute("host.id", slot.host_id)

  const property = await fetch_property(property_id)
  if (!property) {
    logger.error("property not found", { property_id })
    return fail(400, {
      message: "No se encontró la propiedad",
    })
  }

  notification_emitter.emit(NOTIFICATION_EVENT, {
    id: notification.id,
    href: notification.href,
    type: notification_type,
    property_id: notification.property_id,
    created_at: notification.created_at.toISOString(),
    read_at: null,
    location: {
      road: property.location.road,
      house_number: property.location.house_number,
    },
  } satisfies PropertyVisitNotification)

  const host_row = await query_builder
    .selectFrom("user")
    .select(["email", "name"])
    .where("id", "=", slot.host_id)
    .executeTakeFirstOrThrow()
  const visitant_row = await query_builder
    .selectFrom("user")
    .select(["name"])
    .where("id", "=", slot.visitant_id)
    .executeTakeFirstOrThrow()

  await publish_send_slot_reserved_alert(id, {
    host_email: host_row.email,
    host_name: decrypt(host_row.name),
    visitant_name: decrypt(visitant_row.name),
    property_address: display_location(property.location),
    start_date: slot.start_date.toISOString(),
    end_date: slot.end_date.toISOString(),
  })

  logger.info("property visit reserved pending approval", {
    slot_id: id,
    property_id,
    visitant_id,
  })
}
