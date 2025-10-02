import { Form } from "react-router"
import * as v from "valibot"
import { format_date_for_input } from "~/lib/date"
import { require_auth } from "~/lib/server/auth"
import {
  ContractFileTypeSchema,
  get_contract_file_type_label,
} from "~/lib/server/contract_file_type"
import {
  DURATIONS,
  get_duration_label,
} from "~/lib/server/duration"
import { error } from "~/lib/server/error"
import {
  ESCALATION_TYPE,
  get_escalation_label,
} from "~/lib/server/escalation_type"
import { ForceNumberSchema } from "~/lib/server/force_number"
import { has_edit_access } from "~/lib/server/property_access"
import type { Route } from "./+types/_index"
import * as actions from "./actions/server"
import {
  fetch_contract,
  type Contract,
} from "./fetchers/server/contract"
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
  UPDATE_CONTRACT: "update_contract",
  DESTROY_CONTRACT: "destroy_contract",
  CREATE_FILE: "create_file",
  DESTROY_FILE: "destroy_file",
  CREATE_PDF: "create_pdf",
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
      await actions.update_contract(form_data, property_id)
      return null
    }
    case INTENT.DESTROY_CONTRACT: {
      await actions.destroy_contract(form_data)
      return null
    }
    case INTENT.CREATE_FILE: {
      await actions.create_file(form_data)
      return null
    }
    case INTENT.DESTROY_FILE: {
      await actions.destroy_file(form_data)
      return null
    }
    case INTENT.CREATE_PDF: {
      console.log("creating pdf")
      await actions.create_pdf(form_data, property_id)
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
    <>
      <Fields contract={contract} />
      <Documents contract={contract} />
      <Periods contract={contract} />
    </>
  )
}

function Fields({ contract }: { contract: Contract }) {
  const [fine_type, set_fine_type] = useState<FineType>(
    FINE_TYPE.FIXED,
  )
  const [default_type, set_default_type] =
    useState<DefaultType>(DEFAULT_TYPE.FIXED)
  return (
    <section>
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
                  const id = `escalation_${type}`
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
          <p>
            <label htmlFor="fine_amount">
              {fine_type === FINE_TYPE.FIXED
                ? "monto"
                : "porcentaje"}
            </label>
            <input
              id="fine_amount"
              name="fine_amount"
              defaultValue={100000}
              type="number"
              required
            />
          </p>
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
          <p>
            <label htmlFor="default_amount">
              {default_type === DEFAULT_TYPE.FIXED
                ? "monto"
                : "porcentaje"}
            </label>
            <input
              id="default_amount"
              name="default_amount"
              defaultValue={100000}
              type="number"
              required
            />
          </p>
          <p>
            <label htmlFor="default_duration">
              frecuencia
            </label>
            <select
              name="default_duration"
              id="default_duration"
            >
              {DURATIONS.map((duration) => {
                const id = `default_duration_${duration}`
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
            defaultValue={2}
            type="number"
            required
          />
          <span>en cantidad de meses</span>
        </p>
        <button
          type="submit"
          name="intent"
          value={INTENT.UPDATE_CONTRACT}
        >
          actualizar contrato
        </button>
        <button
          type="submit"
          name="intent"
          value={INTENT.DESTROY_CONTRACT}
        >
          eliminar contrato
        </button>
        <button
          type="submit"
          name="intent"
          value={INTENT.CREATE_PDF}
        >
          generar pdf
        </button>
      </Form>
    </section>
  )
}

function Documents({ contract }: { contract: Contract }) {
  return (
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
          <input type="file" id="file" name="file" />
        </p>
        <button
          type="submit"
          name="intent"
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
  )
}

function Periods({ contract }: { contract: Contract }) {
  return (
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
  )
}
