import { Form, redirect } from "react-router"
import type { Route } from "./+types/_index"
import { ForceNumberSchema } from "~/lib/server/force_number.server"
import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { sql } from "kysely"
import { error } from "~/lib/server/error.server"
import * as actions from "./actions/server/index.server"
import { ForceDateSchema } from "~/lib/server/force_date.server"
import { get_date } from "~/lib/date"
import { SLOT_STATE } from "~/lib/slot_state"
import { require_auth } from "~/lib/server/auth.server"
import { format, parseISO } from "date-fns"

const INTENT = {
  SET_DATE: "set_date",
  UPDATE_SLOT: "update_slot",
} as const

export async function action({
  request,
  params,
}: Route.ActionArgs) {
  const form_data = await request.formData()
  const intent = form_data.get("intent")
  if (!intent) {
    throw error(400, "intent is required")
  }
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  switch (intent) {
    case INTENT.SET_DATE: {
      const { redirect_to } = await actions.set_date(
        request,
        form_data,
      )
      return redirect(redirect_to)
    }
    case INTENT.UPDATE_SLOT: {
      await actions.update_slot(form_data, property_id)
      return redirect("..")
    }
  }
  return null
}

export async function loader({
  request,
  params,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  const url = new URL(request.url)
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
  return { dates, times, user }
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const { dates, times, user } = loaderData
  return (
    <>
      <details open>
        <summary>Select Date & Time</summary>
        <Form method="POST">
          <fieldset>
            <legend>Available Dates</legend>
            <div>
              {dates.map((date) => {
                const date_string = get_date(date.date)
                const formatted_date = format(
                  parseISO(date_string),
                  "EEE, MMM d",
                )
                return (
                  <label key={date_string}>
                    <input
                      type="radio"
                      name="date"
                      value={date_string}
                    />
                    <time dateTime={date_string}>
                      {formatted_date}
                    </time>
                  </label>
                )
              })}
            </div>
          </fieldset>
          <button
            type="submit"
            value={INTENT.SET_DATE}
            name="intent"
          >
            Select Date
          </button>
        </Form>
      </details>
      {times.length > 0 && (
        <details open>
          <summary>Available Time Slots</summary>
          <Form method="POST">
            <fieldset>
              <legend className="sr-only">
                Select a time slot
              </legend>

              <div>
                {times.map((time) => {
                  const start_time = format_in_timezone(
                    time.start_date,
                  )
                  const end_time = format_in_timezone(
                    time.end_date,
                  )
                  return (
                    <label key={time.id}>
                      <input
                        type="radio"
                        name="id"
                        value={time.id}
                      />
                      <time
                        dateTime={time.start_date.toISOString()}
                      >
                        {start_time} - {end_time}
                      </time>
                    </label>
                  )
                })}
              </div>
            </fieldset>
            <input
              type="hidden"
              value={user.id}
              name="visitant_id"
            />
            <button
              type="submit"
              value={INTENT.UPDATE_SLOT}
              name="intent"
            >
              Book This Time
            </button>
          </Form>
        </details>
      )}
    </>
  )
}

async function fetch_dates(property_id: number) {
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

async function fetch_times(
  property_id: number,
  date: Date,
) {
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
function format_in_timezone(date: Date) {
  const TIMEZONE = "America/Argentina/Buenos_Aires"
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}
