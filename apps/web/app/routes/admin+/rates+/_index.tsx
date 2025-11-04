import { Form, useLoaderData } from "react-router"
import * as v from "valibot"
import {
  is_webmaster,
  require_auth,
} from "~/lib/server/auth.server"
import { error } from "~/lib/server/error.server"
import {
  get_rate_label,
  RATE_TYPE,
  RateTypeSchema,
  type RateType,
} from "~/lib/rate_type"
import { query_builder } from "db/query_builder"
import { ForceNumberSchema } from "~/lib/server/force_number.server"
import { now } from "~/lib/now"
import type { Route } from "./+types/_index"

export async function loader({
  request,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  if (!is_webmaster(user)) {
    throw error(403, "forbidden")
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
  return {
    current_month,
    current_year,
    rates,
  }
}

export async function action({
  request,
}: Route.ActionArgs) {
  const { user } = await require_auth(request)
  if (!is_webmaster(user)) {
    throw error(403, "forbidden")
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
  const value = v.parse(v.string(), form_data.get("value"))
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
}

export default function AdminRates() {
  const { current_month, current_year, rates } =
    useLoaderData<typeof loader>()
  const rate_types = Object.values(RATE_TYPE)
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Índice de actualización
      </h1>
      <p className="mb-4">
        Mes actual: {current_month}/{current_year}
      </p>
      <div className="space-y-4">
        {rate_types.map((type) => {
          const existing_rate = rates.find(
            (rate) => rate.type === type,
          )
          return (
            <Form
              key={type}
              method="POST"
              navigate={false}
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <input
                type="hidden"
                name="type"
                value={type}
              />
              <input
                type="hidden"
                name="month"
                value={current_month}
              />
              <input
                type="hidden"
                name="year"
                value={current_year}
              />
              <p>
                <label className="w-32 font-medium">
                  {get_rate_label(type as RateType)}
                </label>
                <input
                  type="number"
                  name="value"
                  step="0.01"
                  defaultValue={existing_rate?.value || ""}
                  placeholder="Valor"
                  className="border rounded px-3 py-2 w-48"
                  required
                />
              </p>
              <button
                type="submit"
                style={{
                  height: "30px",
                }}
              >
                Guardar
              </button>
            </Form>
          )
        })}
      </div>
    </div>
  )
}
