import { Form, redirect } from "react-router"
import * as v from "valibot"
import { require_auth } from "~/lib/server/auth"
import { ContractState } from "~/lib/server/contract_state"
import { ContractType } from "~/lib/server/contract_type"
import {
  DURATIONS,
  DurationSchema,
  get_duration_label,
} from "~/lib/server/duration"
import { error } from "~/lib/server/error"
import { ForceNumberSchema } from "~/lib/server/force_number"
import {
  ESCALATION_TYPE,
  EscalationTypeSchema,
  get_escalation_formula,
  get_escalation_label,
} from "~/lib/server/escalation_type"
import { has_edit_access } from "~/lib/server/property_access"
import { query_builder } from "~/lib/server/query_builder"
import type { Route } from "./+types/new"
import {
  FINE_TYPE,
  FineTypeSchema,
  get_fine_label,
  type FineType,
} from "~/lib/server/fine_type"
import { useState } from "react"
import {
  DEFAULT_TYPE,
  DefaultTypeSchema,
  get_default_label,
  type DefaultType,
} from "~/lib/server/default_type"

const INTENT = {
  CREATE_CONTRACT: "create_contract",
} as const

function fetch_owner(property_id: number) {
  return query_builder
    .selectFrom("user")
    .innerJoin("property", "property.user_id", "user.id")
    .select(["user.id"])
    .where("property.id", "=", property_id)
    .executeTakeFirstOrThrow()
}

async function make_pdf() {
  return fetch(
    "http://localhost:5173/properties/2/contracts/pdf",
    {
      method: "POST",
      headers: {
        Accept: "*/*",
      },
    },
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "there was an error while generating the pdf",
        )
      }
      return response.blob()
    })
    .then((blob) => {
      return blob
    })
}

export async function loader({
  request,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  if (!has_edit_access(user.accesses)) {
    throw error(400, "not found")
  }
  return {}
}

export async function action({
  request,
  params,
}: Route.ActionArgs) {
  const { user } = await require_auth(request)
  if (!has_edit_access(user.accesses)) {
    throw error(400, "not found")
  }
  const form_data = await request.formData()
  const intent = form_data.get("intent")
  if (!intent) {
    throw error(400, "intent is required")
  }
  const property_id = v.parse(ForceNumberSchema, params.id)
  const now = new Date().toISOString()
  switch (intent) {
    case INTENT.CREATE_CONTRACT: {
      const start_date = v.parse(
        v.string(),
        form_data.get("start_date"),
      )
      const end_date = v.parse(
        v.string(),
        form_data.get("end_date"),
      )
      const escalation_duration = v.parse(
        DurationSchema,
        form_data.get("escalation_duration"),
      )
      const escalation_type = v.parse(
        EscalationTypeSchema,
        Number(form_data.get("escalation_type")),
      )
      const price = v.parse(
        ForceNumberSchema,
        form_data.get("price"),
      )
      // const _fine = v.parse(
      //   ForceNumberSchema,
      //   form_data.get("fine"),
      // )
      // const _default_ = v.parse(
      //   ForceNumberSchema,
      //   form_data.get("default"),
      // )
      // const _early_termination = v.parse(
      //   ForceNumberSchema,
      //   form_data.get("early_termination"),
      // )
      const deposit = price * 1.3
      console.log("deposit", deposit)
      const owner = await fetch_owner(property_id)
      console.log("owner", owner)
      // NOTE: the tenant will already exist, picked
      // from a pool of valid candidates
      // const tenant = await fetch_tenant(property_id)
      const pdf = await make_pdf()
      const contract_file = await query_builder
        .transaction()
        .execute(async (tx) => {
          const contract = await tx
            .insertInto("contract")
            .values({
              property_id,
              created_at: now,
              updated_at: now,
              state: ContractState.INACTIVE,
              end_date,
              duration: escalation_duration,
              formula:
                get_escalation_formula(escalation_type),
              start_date,
              type: ContractType.LONG_TERM,
            })
            .returning("id")
            .executeTakeFirstOrThrow()
          const content = Buffer.from(
            await pdf.arrayBuffer(),
          )
          const hash = Bun.CryptoHasher.hash(
            "sha256",
            content,
            "hex",
          )
          const file = await tx
            .insertInto("file")
            .values({
              content,
              mime: pdf.type,
              basename: "contract.pdf",
              created_at: now,
              updated_at: now,
              hash: hash,
              size: pdf.size,
            })
            .returning("id")
            .executeTakeFirstOrThrow()
          const contract_file = await tx
            .insertInto("contract_file")
            .values({
              file_id: file.id,
              user_id: 1,
              contract_id: contract.id,
              created_at: now,
              updated_at: now,
            })
            .returning("id")
            .executeTakeFirstOrThrow()
          return contract_file
        })
      console.log(
        "created contract file with id",
        contract_file.id,
      )
      return redirect(`/properties/${property_id}/edit`)
    }
  }
}

export default function () {
  const [fine_type, set_fine_type] = useState<FineType>(
    FINE_TYPE.FIXED,
  )
  const [default_type, set_default_type] =
    useState<DefaultType>(DEFAULT_TYPE.FIXED)
  return (
    <main>
      <h1>nuevo contrato</h1>
      <Form method="POST">
        <p>
          <label htmlFor="start_date">
            fecha de inicio
          </label>
          <input
            id="start_date"
            name="start_date"
            required
            type="datetime-local"
          />
        </p>
        <p>
          <label htmlFor="end_date">
            fecha de finalizacion
          </label>
          <input
            id="end_date"
            type="datetime-local"
            required
            name="end_date"
          />
        </p>
        <p>
          <label htmlFor="price">precio inicial</label>
          <input
            id="price"
            name="price"
            type="number"
            required
          />
        </p>
        <fieldset>
          <legend>aumento</legend>
          <p>
            <label htmlFor="escalation_type">tipo</label>
            <select
              name="escalation_type"
              id="escalation_type"
            >
              {Object.values(ESCALATION_TYPE).map(
                (type) => {
                  const id = `fine_${type}`
                  return (
                    <option key={id} value={type}>
                      {get_escalation_label(type)}
                    </option>
                  )
                },
              )}
            </select>
          </p>
          <p>
            <label htmlFor="escalation_duration">
              frecuencia
            </label>
            <select
              name="escalation_duration"
              id="escalation_duration"
              defaultValue="P3M"
            >
              {DURATIONS.map((duration) => {
                const id = `escalation_duration_${duration}`
                return (
                  <option key={id} value={duration}>
                    {get_duration_label(duration)}
                  </option>
                )
              })}
            </select>
          </p>
        </fieldset>
        <fieldset>
          <legend>mora</legend>
          <p>
            <label htmlFor="fine_type">tipo</label>
            <select
              name="fine_type"
              id="fine_type"
              onClick={(event) => {
                const fine_type = v.parse(
                  FineTypeSchema,
                  Number(event.currentTarget.value),
                )
                set_fine_type(fine_type)
              }}
            >
              {Object.values(FINE_TYPE).map((type) => {
                const id = `fine_${type}`
                return (
                  <option key={id} value={type}>
                    {get_fine_label(type)}
                  </option>
                )
              })}
            </select>
          </p>
          {fine_type === FINE_TYPE.FIXED ? (
            <p>
              <label htmlFor="fine_type">monto</label>
              <input
                id="default"
                name="default"
                type="number"
                required
              />
            </p>
          ) : (
            <p>
              <label htmlFor="fine_type">porcentaje</label>
              <input
                id="default"
                name="default"
                type="number"
                required
              />
            </p>
          )}
        </fieldset>
        <fieldset>
          <legend>multa</legend>
          <p>
            <label htmlFor="default_type">tipo</label>
            <select
              name="default_type"
              id="default_type"
              onClick={(event) => {
                const default_type = v.parse(
                  DefaultTypeSchema,
                  Number(event.currentTarget.value),
                )
                set_default_type(default_type)
              }}
            >
              {Object.values(DEFAULT_TYPE).map((type) => {
                const id = `default_${type}`
                return (
                  <option key={id} value={type}>
                    {get_default_label(type)}
                  </option>
                )
              })}
            </select>
          </p>
          {default_type === DEFAULT_TYPE.FIXED ? (
            <p>
              <label htmlFor="fine_type">monto</label>
              <input
                id="default"
                name="default"
                type="number"
                required
              />
            </p>
          ) : (
            <p>
              <label htmlFor="fine_type">porcentaje</label>
              <input
                id="default"
                name="default"
                type="number"
                required
              />
            </p>
          )}
          <p>
            <label htmlFor="fine_duration">
              frecuencia
            </label>
            <select name="fine_duration" id="fine_duration">
              {DURATIONS.map((duration) => {
                const id = `fine_duration_${duration}`
                return (
                  <option key={id} value={duration}>
                    {get_duration_label(duration)}
                  </option>
                )
              })}
            </select>
          </p>
        </fieldset>
        <p>
          <label htmlFor="early_termination">
            resolucion anticipada
          </label>
          <input
            id="early_termination"
            name="early_termination"
            type="number"
            required
          />
          <span>en cantidad de meses</span>
        </p>
        <button
          type="submit"
          name="intent"
          value={INTENT.CREATE_CONTRACT}
        >
          crear contratasdfsadfo
        </button>
      </Form>
    </main>
  )
}
