import { Form, redirect } from "react-router"
import * as v from "valibot"
import { require_auth } from "~/lib/server/auth"
import { ContractState } from "~/lib/server/contract_state"
import { ContractType } from "~/lib/server/contract_type"
import {
  DURATIONS,
  DurationSchema,
  label_duration,
} from "~/lib/server/duration"
import { error } from "~/lib/server/error"
import { ForceNumberSchema } from "~/lib/server/force_number"
import { FORMULAS } from "~/lib/server/formula"
import { has_edit_access } from "~/lib/server/property_access"
import { query_builder } from "~/lib/server/query_builder"
import type { Route } from "./+types/new"

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
      const duration = v.parse(
        DurationSchema,
        form_data.get("duration"),
      )
      const formula = v.parse(
        v.string(),
        form_data.get("formula"),
      )
      const price = v.parse(
        ForceNumberSchema,
        form_data.get("price"),
      )
      const _fine = v.parse(
        ForceNumberSchema,
        form_data.get("fine"),
      )
      const _default_ = v.parse(
        ForceNumberSchema,
        form_data.get("default"),
      )
      const _early_leave = v.parse(
        ForceNumberSchema,
        form_data.get("early_leave"),
      )
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
              duration,
              formula,
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
            <label htmlFor="duration">frecuencia</label>
            <select name="duration" id="duration">
              {DURATIONS.map((duration) => {
                const id = `duration_${duration}`
                return (
                  <option key={id} value={duration}>
                    {label_duration(duration)}
                  </option>
                )
              })}
            </select>
          </p>
          <p>
            <label htmlFor="formula">formula</label>
            <select name="formula" id="formula">
              {FORMULAS.map((formula) => {
                const id = `formula_${formula.label}`
                return (
                  <option key={id} value={formula.pattern}>
                    {formula.label}
                  </option>
                )
              })}
            </select>
          </p>
        </fieldset>
        <p>
          <label htmlFor="default">mora</label>
          <input
            id="default"
            name="default"
            type="number"
            required
          />
          <span>en cantidad de meses</span>
        </p>
        <p>
          <label htmlFor="fine">multa</label>
          <input
            id="fine"
            name="fine"
            type="number"
            required
          />
          <span>en cantidad de meses</span>
        </p>
        <p>
          <label htmlFor="early_leave">
            resolucion anticipada
          </label>
          <input
            id="early_leave"
            name="early_leave"
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
          crear contrato
        </button>
      </Form>
    </main>
  )
}
