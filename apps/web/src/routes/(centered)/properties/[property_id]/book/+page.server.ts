import { require_authentication } from "$lib/server/auth"
import { trace } from "@opentelemetry/api"
import { redirect } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { display_location } from "$lib/display_location"
import type { NoAvailableSlotsNotification } from "$lib/fetchers/notifications.schemas"
import { ForceNumberSchema } from "$lib/force_number"
import {
  compose_no_available_slots_href,
  NOTIFICATION_TYPE,
} from "$lib/notification_type"
import { safe_async } from "$lib/safe_async"
import { publish_send_no_slots_alert } from "$lib/server/broker/producer/publish_send_no_slots_alert"
import { decrypt } from "$lib/server/encryption"
import { kv } from "$lib/server/kv"
import { get_origin } from "$lib/server/origin"
import {
  NOTIFICATION_EVENT,
  notification_emitter,
} from "$lib/server/notification_emitter"
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
  require_authentication(locals, url)
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
  if (slots.length === 0) {
    notify_no_available_slots(property_id, locals.user)
  }
  const date = url.searchParams.get("date")
  if (!date && slots.length > 0) {
    const first_date = slots[0].start_date
      .toISOString()
      .split("T")[0]
    url.searchParams.set("date", first_date)
    redirect(
      302,
      url.pathname + "?" + url.searchParams.toString(),
    )
  }
  return {
    slots,
    date,
    user: locals.user,
    has_credit_report,
  }
}

export const actions: Actions = {
  [ACTION.UPDATE_SLOT]: async ({ request, params }) => {
    const tracer = trace.getTracer("web.action")
    const span = tracer.startSpan("/properties/:id/book/update_slot")
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
}

function fetch_free_slots(property_id: number) {
  return query_builder
    .selectFrom("slot")
    .where("slot.property_id", "=", property_id)
    .where("slot.state", "=", SLOT_STATE.FREE)
    .where("slot.visitant_id", "is", null)
    .select(["slot.id", "slot.start_date", "slot.end_date"])
    .orderBy("slot.start_date", "asc")
    .execute()
}

function fetch_property_manager(property_id: number) {
  return query_builder
    .selectFrom("user")
    .innerJoin(
      "property_access",
      "property_access.user_id",
      "user.id",
    )
    .where(
      "property_access.property_id",
      "=",
      property_id,
    )
    .where(
      "property_access.type",
      "=",
      ACCESS_TYPE.MANAGER,
    )
    .select(["user.email", "user.name"])
    .executeTakeFirst()
}

function fetch_property_location(property_id: number) {
  return query_builder
    .selectFrom("property")
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .where("property.id", "=", property_id)
    .select([
      "location.road",
      "location.house_number",
      "location.suburb",
      "location.city",
      "location.town",
      "location.state",
    ])
    .executeTakeFirst()
}

const NO_SLOTS_ALERT_TTL_SECONDS = 86400

async function notify_no_available_slots(
  property_id: number,
  user: NonNullable<App.Locals["user"]>,
) {
  const dedup_key = `no_slots_alert:${property_id}:${user.id}`
  const [dedup_error, existing] = await safe_async(
    kv.get(dedup_key),
  )
  if (dedup_error) {
    logger.error(dedup_error.message, { property_id }, dedup_error)
    return
  }
  if (existing) return

  const [manager_error, manager] = await safe_async(
    fetch_property_manager(property_id),
  )
  if (manager_error) {
    logger.error(manager_error.message, { property_id }, manager_error)
    return
  }
  if (!manager) return

  const [location_error, location] = await safe_async(
    fetch_property_location(property_id),
  )
  if (location_error) {
    logger.error(location_error.message, { property_id }, location_error)
    return
  }
  if (!location) return

  const notification_type = NOTIFICATION_TYPE.NO_AVAILABLE_SLOTS
  const now_date = new Date()
  const [notification_error, notification] = await safe_async(
    query_builder
      .insertInto("notification")
      .values({
        type: notification_type,
        href: compose_no_available_slots_href(property_id),
        property_id,
        created_at: now_date,
        updated_at: now_date,
      })
      .returning([
        "notification.id",
        "notification.type",
        "notification.href",
        "notification.property_id",
        "notification.created_at",
      ])
      .executeTakeFirstOrThrow(),
  )
  if (notification_error) {
    logger.error(
      notification_error.message,
      { property_id },
      notification_error,
    )
    return
  }

  notification_emitter.emit(NOTIFICATION_EVENT, {
    id: notification.id,
    href: notification.href,
    type: notification_type,
    property_id: notification.property_id,
    created_at: notification.created_at.toISOString(),
    read_at: null,
    location: {
      road: location.road,
      house_number: location.house_number,
    },
  } satisfies NoAvailableSlotsNotification)

  const visits_url = `${get_origin()}${compose_no_available_slots_href(property_id)}`
  const [publish_error] = await safe_async(
    publish_send_no_slots_alert(property_id, user.id, {
      manager_email: manager.email,
      manager_name: decrypt(manager.name),
      visitant_name: user.name ?? "Visitante",
      property_address: display_location(location),
      visits_url,
    }),
  )
  if (publish_error) {
    logger.error(
      publish_error.message,
      { property_id },
      publish_error,
    )
  }

  const [kv_set_error] = await safe_async(
    kv.set(dedup_key, "1", NO_SLOTS_ALERT_TTL_SECONDS),
  )
  if (kv_set_error) {
    logger.error(
      kv_set_error.message,
      { property_id },
      kv_set_error,
    )
  }
}
