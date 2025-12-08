import { Form, redirect } from "react-router"
import { Button } from "~/components/button"
import { Content } from "~/components/content"
import { Section } from "~/components/section"
import type { Route } from "./+types/_index"
import { ForceNumberSchema } from "~/lib/force_number"
import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { sql } from "kysely"
import { error } from "~/lib/error.server"
import * as actions from "./actions/index.server"
import { ForceDateSchema } from "~/lib/force_date.server"
import { get_date } from "~/lib/date"
import { SLOT_STATE } from "~/lib/slot_state"
import { require_auth } from "~/lib/auth.server"
import { format, parseISO } from "date-fns"
import { trace } from "@opentelemetry/api"
import { logger } from "~/lib/telemetry/logger.server"
import type { ObjectValues } from "~/lib/rate_type"

const INTENT = {
  SET_DATE: "set_date",
  UPDATE_SLOT: "update_slot",
} as const
export const IntentSchema = v.picklist(
  Object.values(INTENT),
)
export type RateType = ObjectValues<typeof INTENT>

const ERROR = {
  NOT_FOUND: "not found",
  INTENT_IS_REQUIRED: "intent is required",
}

export async function action({
  request,
  params,
}: Route.ActionArgs) {
  const tracer = trace.getTracer("web.action")
  return tracer.startActiveSpan(
    "/properties/:id/book",
    async (span) => {
      const form_data = await request.formData()
      const { output: intent, success } = v.safeParse(
        IntentSchema,
        form_data.get("intent"),
      )
      if (!success) {
        logger.error(ERROR.INTENT_IS_REQUIRED)
        span.end()
        throw error(400, ERROR.NOT_FOUND)
      }
      span.setAttribute("intent", intent)
      const property_id = v.parse(
        ForceNumberSchema,
        params.property_id,
      )
      form_data.set("property_id", String(property_id))
      span.setAttribute("property.id", property_id)
      switch (intent) {
        case INTENT.SET_DATE: {
          try {
            const { redirect_to } =
              await actions.set_date.execute(
                request,
                form_data,
              )
            logger.info("date set successfully")
            span.end()
            return redirect(redirect_to)
          } catch (error) {
            if (error instanceof v.ValiError) {
              span.end()
              return {
                errors: {
                  set_date:
                    actions.set_date.get_errors(error),
                },
              }
            }
          }
        }
        case INTENT.UPDATE_SLOT: {
          try {
            await actions.update_slot.execute(
              form_data,
              span,
            )
            logger.info("slot updated successfully")
            span.end()
            return redirect("..")
          } catch (error) {
            if (error instanceof v.ValiError) {
              span.end()
              return {
                errors: {
                  update_slot:
                    actions.update_slot.get_errors(error),
                },
              }
            }
          }
        }
      }
      span.end()
      return null
    },
  )
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
  actionData,
}: Route.ComponentProps) {
  const { times } = loaderData
  return (
    <Content.Root>
      <Content.Title>Reservar visita</Content.Title>
      <Content.Section>
        <Section.Header>
          <Section.Title>Seleccionar fecha</Section.Title>
        </Section.Header>
        <SetDateForm
          loaderData={loaderData}
          actionData={actionData}
        />
      </Content.Section>
      {times.length > 0 && (
        <Content.Section>
          <Section.Header>
            <Section.Title>Seleccionar horario</Section.Title>
          </Section.Header>
          <UpdateSlotForm
            loaderData={loaderData}
            actionData={actionData}
          />
        </Content.Section>
      )}
    </Content.Root>
  )
}

function UpdateSlotForm({
  loaderData,
  actionData,
}: {
  loaderData: Route.ComponentProps["loaderData"]
  actionData: Route.ComponentProps["actionData"]
}) {
  const { user, times } = loaderData
  const errors = actionData?.errors?.update_slot
  return (
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
      {errors?.id ? <span>{errors.id}</span> : null}
      <input
        type="hidden"
        value={user.id}
        name="visitant_id"
      />
      <Button
        type="submit"
        value={INTENT.UPDATE_SLOT}
        name="intent"
      >
        Book This Time
      </Button>
    </Form>
  )
}

function SetDateForm({
  loaderData,
  actionData,
}: {
  loaderData: Route.ComponentProps["loaderData"]
  actionData: Route.ComponentProps["actionData"]
}) {
  const { dates } = loaderData
  const errors = actionData?.errors?.set_date
  return (
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
      {errors?.date ? <span>{errors.date}</span> : null}
      <Button
        type="submit"
        value={INTENT.SET_DATE}
        name="intent"
      >
        Select Date
      </Button>
    </Form>
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
