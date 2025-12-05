import { Form } from "react-router"
import * as v from "valibot"
import { format_date_for_input } from "~/lib/date"
import { require_auth } from "~/lib/auth.server"
import {
  ContractFileTypeSchema,
  get_contract_file_types,
} from "~/lib/contract_file_type"
import { get_contract_file_type_label } from "~/lib/contract_file_type"
import {
  DURATIONS,
  get_duration_label,
} from "~/lib/duration"
import { error } from "~/lib/error.server"
import {
  ESCALATION_TYPE,
  get_escalation_label,
} from "~/lib/escalation_type"
import { ForceNumberSchema } from "~/lib/force_number"
import { has_edit_access } from "~/lib/property_access.server"
import type { Route } from "./+types/_index"
import * as actions from "./actions/index.server"
import {
  fetch_contract,
  type Contract,
} from "./fetchers/contract.server"
import { fetch_owner } from "~/lib/owner.server"
import { fetch_tenant } from "~/lib/tenant.server"
import { get_tribunal_label, TRIBUNAL } from "~/lib/court"
import { get_property_destiny_label } from "~/lib/property_destiny"
import {
  fetch_property,
  type Property,
} from "~/routes/properties+/fetchers/property.server"

const INTENT = {
  CREATE_CONTRACT: "create_contract",
  UPDATE_CONTRACT: "update_contract",
  DESTROY_CONTRACT: "destroy_contract",
  CREATE_FILE: "create_file",
  DESTROY_FILE: "destroy_file",
  CREATE_PDF: "create_pdf",
} as const

const INVENTORY = [
  { id: 1, name: "mesa algarrobo", has_photo: false },
  { id: 2, name: "velador de dormitorio", has_photo: true },
] as const

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
      message: "contract id should be a number",
    },
  )
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
    {
      message: "property id should be a number",
    },
  )
  const contract = await fetch_contract(contract_id)
  if (!contract) {
    throw new Error(
      `contract does not exist for id ${contract_id}`,
    )
  }
  const property = await fetch_property(property_id)
  if (!property) {
    throw new Error(
      `property does not exist for id ${property_id}`,
    )
  }
  const owner = await fetch_owner(property_id)
  const tenant = await fetch_tenant(property_id)
  const contract_file_types = get_contract_file_types()
  return {
    contract,
    property,
    owner,
    tenant,
    contract_file_types,
  }
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const {
    contract,
    property,
    tenant,
    owner,
    contract_file_types,
  } = loaderData
  return (
    <>
      <Form method="POST">
        <input
          type="hidden"
          value={contract.id}
          name="id"
        />
        <Section number={2} title="estado">
          <SectionTwo />
        </Section>
        <Section number={3} title="destino">
          <SectionThree property={property} />
        </Section>
        <Section number={6} title="plazo">
          <SectionSix contract={contract} />
        </Section>
        <Section number={7} title="canon locativo">
          <SectionSeven contract={contract} />
        </Section>
        <Section number={8} title="forma de pago">
          <SectionEight contract={contract} />
        </Section>
        <Section number={9} title="mora">
          <SectionNine contract={contract} />
        </Section>
        <Section number={14} title="devoluciones">
          <SectionFourteen contract={contract} />
        </Section>
        <Section number={15} title="recesion anticipada">
          <SectionFifteen contract={contract} />
        </Section>
        <Section number={16} title="muestra de propiedad">
          <SectionSixteen contract={contract} />
        </Section>
        <Section number={21} title="jurisdiccion">
          <SectionTwentyOne contract={contract} />
        </Section>
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
          disabled={!owner || !tenant}
          value={INTENT.CREATE_PDF}
        >
          generar pdf
        </button>
      </Form>
      <Documents
        contract={contract}
        contract_file_types={contract_file_types}
      />
      <Periods contract={contract} />
    </>
  )
}

function Section({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h3>
        seccion {number}: {title}
      </h3>
      {children}
    </section>
  )
}

function SectionTwo() {
  return (
    <ul>
      {INVENTORY.map((item) => {
        const id = `inventory_${item.id}`
        return (
          <li key={id}>
            <span>{item.name}</span>
            <button type="button">
              {item.has_photo
                ? "cambiar foto"
                : "subir foto"}
            </button>
            <button type="button">eliminar objeto</button>
          </li>
        )
      })}
    </ul>
  )
}

function SectionThree({
  property,
}: {
  property: Property
}) {
  return (
    <ul>
      {property.destinies.map((destiny) => {
        const id = `destiny_${destiny}`
        return (
          <li key={id}>
            <input
              type="radio"
              id={id}
              name="destiny"
              value={destiny}
            />
            <label htmlFor={id}>
              {get_property_destiny_label(destiny)}
            </label>
          </li>
        )
      })}
    </ul>
  )
}

function SectionSix({ contract }: { contract: Contract }) {
  return (
    <>
      <p>
        <label htmlFor="start_date">fecha de inicio</label>
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
    </>
  )
}

function SectionSeven({
  contract,
}: {
  contract: Contract
}) {
  return (
    <fieldset>
      <legend>aumento</legend>
      <p>
        <label htmlFor="escalation_type">tipo</label>
        <select
          name="escalation_type"
          id="escalation_type"
          defaultValue={
            contract.escalation_type ?? undefined
          }
        >
          {Object.values(ESCALATION_TYPE).map((type) => {
            const id = `escalation_${type}`
            return (
              <option key={id} value={type}>
                {get_escalation_label(type)}
              </option>
            )
          })}
        </select>
      </p>
      <p>
        <label htmlFor="escalation_duration">cada</label>
        <select
          name="escalation_duration"
          id="escalation_duration"
          defaultValue={
            contract.escalation_duration ?? undefined
          }
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
  )
}

function SectionEight({
  contract,
}: {
  contract: Contract
}) {
  return (
    <p>
      <label htmlFor="cbu">cbu</label>
      <input id="cbu" name="cbu" type="text" />
    </p>
  )
}

function SectionNine({ contract }: { contract: Contract }) {
  return (
    <p>
      <label htmlFor="fine_percentage">porcentaje</label>
      <input
        id="fine_percentage"
        name="fine_percentage"
        type="number"
        defaultValue={contract.fine_amount ?? undefined}
      />
    </p>
  )
}

function SectionFourteen({
  contract,
}: {
  contract: Contract
}) {
  return (
    <p>
      <label htmlFor="devoluciones_percentage">
        porcentaje
      </label>
      <input
        id="devoluciones_percentage"
        name="devoluciones_percentage"
        type="number"
      />
    </p>
  )
}

function SectionFifteen({
  contract,
}: {
  contract: Contract
}) {
  return (
    <p>
      <label htmlFor="early_termination">descripcion</label>
      <textarea
        id="early_termination"
        name="early_termination"
        defaultValue={
          contract.early_termination ?? undefined
        }
      />
    </p>
  )
}

function SectionSixteen({
  contract,
}: {
  contract: Contract
}) {
  return (
    <p>
      <label htmlFor="muestra_horas">
        cantidad de horas
      </label>
      <input
        id="muestra_horas"
        name="muestra_horas"
        type="number"
      />
    </p>
  )
}

function SectionTwentyOne({
  contract,
}: {
  contract: Contract
}) {
  return (
    <p>
      <label htmlFor="tribunal">tribunal</label>
      <select name="tribunal" id="tribunal">
        {Object.values(TRIBUNAL).map((type) => {
          const id = `tribunal_${type}`
          return (
            <option key={id} value={type}>
              {get_tribunal_label(type)}
            </option>
          )
        })}
      </select>
    </p>
  )
}

function Documents({
  contract,
  contract_file_types,
}: {
  contract: Contract
  contract_file_types: number[]
}) {
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
        <p>
          <label htmlFor="file_type">tipo</label>
          <select name="file_type" id="file_type" required>
            {contract_file_types.map((type) => {
              const id = `file_type_${type}`
              return (
                <option key={id} value={type}>
                  {get_contract_file_type_label(type)}
                </option>
              )
            })}
          </select>
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
