import { Form, Link } from "react-router"
import * as v from "valibot"
import { require_auth } from "~/lib/server/auth"
import { CONTRACT_STATE } from "~/lib/server/contract_state"
import {
  DURATIONS,
  get_duration_label,
} from "~/lib/server/duration"
import { error } from "~/lib/server/error"
import { ForceNumberSchema } from "~/lib/server/force_number"
import {
  ESCALATION_TYPE,
  get_escalation_label,
} from "~/lib/server/escalation_type"
import { has_edit_access } from "~/lib/server/property_access"
import { fetch_contract } from "./fetchers/server/contract"
import type { Route } from "./+types/_index"
import {
  ContractFileTypeSchema,
  get_contract_file_type_label,
} from "~/lib/server/contract_file_type"
import { format_date_for_input } from "~/lib/date"
import * as actions from "./actions/server"

const INTENT = {
  CREATE_CONTRACT: "create_contract",
  UPDATE_CONTRACT: "update_contract",
  DESTROY_CONTRACT: "destroy_contract",
  CREATE_FILE: "create_file",
  DESTROY_FILE: "destroy_file",
} as const

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
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
    {
      message: "property id should be a number",
    },
  )
  switch (intent) {
    case INTENT.UPDATE_CONTRACT: {
      actions.update_contract(form_data, property_id)
      return null
    }
    case INTENT.DESTROY_CONTRACT: {
      actions.destroy_contract(form_data)
      return null
    }
    case INTENT.CREATE_FILE: {
      actions.create_file(form_data)
      return null
    }
    case INTENT.DESTROY_FILE: {
      actions.destroy_file(form_data)
      return null
    }
  }
  return null
}

export async function loader({
  request,
  params,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  if (!has_edit_access(user.accesses)) {
    throw error(400, "not found")
  }
  const contract_id = v.parse(
    ForceNumberSchema,
    params.contract_id,
    {
      message: "property id should be a number",
    },
  )
  const contract = await fetch_contract(contract_id)
  if (!contract) {
    throw new Error(
      `property does not exist for id ${contract_id}`,
    )
  }
  return { contract }
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const { contract } = loaderData
  return (
    <main>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2>contratos</h2>
        <Link
          to={`/properties/${contract.id}/contracts/new`}
        >
          crear contrato
        </Link>
      </header>

      <Form method="POST">
        <input
          type="hidden"
          value={contract.id}
          name="id"
        />
        <p>
          <label htmlFor="start_date">
            fecha de inicio
          </label>
          <input
            id="start_date"
            name="start_date"
            type="datetime-local"
            readOnly={
              contract.state !== CONTRACT_STATE.INACTIVE
            }
            defaultValue={
              contract.start_date
                ? format_date_for_input(contract.start_date)
                : undefined
            }
          />
        </p>
        <p>
          <label htmlFor="end_date">
            fecha de finalizacion
          </label>
          <input
            id="end_date"
            type="datetime-local"
            name="end_date"
            readOnly={
              contract.state !== CONTRACT_STATE.INACTIVE
            }
            defaultValue={
              contract.end_date
                ? format_date_for_input(contract.end_date)
                : undefined
            }
          />
        </p>
        <p>
          <label htmlFor="duration">frecuencia</label>
          <select
            name="duration"
            id="duration"
            defaultValue={contract.duration ?? undefined}
          >
            {DURATIONS.map((duration) => {
              const id = `duration_${duration}`
              return (
                <option key={id} value={duration}>
                  {get_duration_label(duration)}
                </option>
              )
            })}
          </select>
        </p>
        <p>
          <label htmlFor="formula">formula</label>
          <select
            name="formula"
            id="formula"
            defaultValue={contract.formula ?? undefined}
          >
            {Object.values(ESCALATION_TYPE).map((type) => {
              const id = `formula_${type}`
              return (
                <option key={id} value={type}>
                  {get_escalation_label(type)}
                </option>
              )
            })}
          </select>
        </p>
        <button
          type="submit"
          name="intent"
          disabled={
            contract.state !== CONTRACT_STATE.INACTIVE
          }
          value={INTENT.UPDATE_CONTRACT}
        >
          actualizar contrato
        </button>
        <button
          type="submit"
          name="intent"
          disabled={
            contract.state !== CONTRACT_STATE.INACTIVE
          }
          value={INTENT.DESTROY_CONTRACT}
        >
          eliminar contrato
        </button>
      </Form>
      <section>
        <h3>documentos</h3>
        <Form
          method="POST"
          encType="multipart/form-data"
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <input
            type="hidden"
            value={contract.id}
            name="contract_id"
          />
          <p>
            <label htmlFor="file">documento</label>
            <input
              type="file"
              id="file"
              name="file"
              disabled={
                contract.state !== CONTRACT_STATE.INACTIVE
              }
            />
          </p>
          <button
            type="submit"
            name="intent"
            disabled={
              contract.state !== CONTRACT_STATE.INACTIVE
            }
            value={INTENT.CREATE_FILE}
          >
            agregar documento
          </button>
          <ul
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {contract.files.map((file) => {
              const id = `file_${file.basename}`
              const contract_type = v.parse(
                ContractFileTypeSchema,
                file.type,
              )
              return (
                <li
                  key={id}
                  style={{
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>
                    {get_contract_file_type_label(
                      contract_type,
                    )}
                  </span>
                  <input
                    type="hidden"
                    value={file.id}
                    name="id"
                  />
                  <button
                    type="submit"
                    name="intent"
                    disabled={
                      contract.state !==
                      CONTRACT_STATE.INACTIVE
                    }
                    value={INTENT.DESTROY_FILE}
                  >
                    eliminar
                  </button>
                  <a href={`/files/${file.id}`}>
                    Download {file.basename}
                  </a>
                </li>
              )
            })}
          </ul>
        </Form>
      </section>
      <section>
        <h3>períodos</h3>
        <Form
          method="POST"
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <input
            type="hidden"
            value={contract.id}
            name="contract_id"
          />
          <ul
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {contract.periods.map((period) => {
              console.log(
                "contract.periods.length",
                contract.periods.length,
              )
              const id = `file_${period.start_date}`
              const is_first =
                contract.periods[0].start_date ===
                period.start_date
              return (
                <li
                  key={id}
                  style={{
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <input
                    type="hidden"
                    value={period.id}
                    name="id"
                  />
                  {is_first ? (
                    <span style={{ fontWeight: "bold" }}>
                      inicial
                    </span>
                  ) : null}
                  <span>${period.price}</span>
                </li>
              )
            })}
          </ul>
        </Form>
      </section>
    </main>
  )
}
