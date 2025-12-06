import { useRef } from "react"
import { Form } from "react-router"
import * as v from "valibot"
import { Button } from "~/components/button"
import { Formulary } from "~/components/formulary"
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
    <Formulary.Root label="Edición de contrato">
      <Form method="POST">
        <input
          type="hidden"
          value={contract.id}
          name="id"
        />
        <InventorySection />
        <DestinySection property={property} />
        <DatesSection contract={contract} />
        <EscalationSection contract={contract} />
        <PaymentSection />
        <FineSection contract={contract} />
        <ReturnsSection />
        <EarlyTerminationSection contract={contract} />
        <ShowingSection />
        <JurisdictionSection />
        <Formulary.Actions>
          <Button
            type="submit"
            name="intent"
            value={INTENT.UPDATE_CONTRACT}
          >
            actualizar contrato
          </Button>
          <Button
            type="submit"
            name="intent"
            value={INTENT.DESTROY_CONTRACT}
          >
            eliminar contrato
          </Button>
          <Button
            type="submit"
            name="intent"
            disabled={!owner || !tenant}
            value={INTENT.CREATE_PDF}
          >
            generar pdf
          </Button>
        </Formulary.Actions>
      </Form>
      <DocumentsSection
        contract={contract}
        contract_file_types={contract_file_types}
      />
      <PeriodsSection contract={contract} />
    </Formulary.Root>
  )
}

function InventorySection() {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>sección 2: estado</Formulary.Title>
      </Formulary.Header>
      <ul className="flex flex-col gap-2 list-none p-0 m-0">
        {INVENTORY.map((item) => {
          const id = `inventory_${item.id}`
          return (
            <li key={id} className="flex items-center gap-4">
              <span>{item.name}</span>
              <Button type="button">
                {item.has_photo ? "cambiar foto" : "subir foto"}
              </Button>
              <Button type="button">eliminar objeto</Button>
            </li>
          )
        })}
      </ul>
    </Formulary.Section>
  )
}
function DestinySection({
  property,
}: {
  property: Property
}) {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>sección 3: destino</Formulary.Title>
      </Formulary.Header>
      <fieldset>
        {property.destinies.map((destiny) => (
          <Formulary.Radio
            key={destiny}
            name="destiny"
            value={destiny}
          >
            {get_property_destiny_label(destiny)}
          </Formulary.Radio>
        ))}
      </fieldset>
    </Formulary.Section>
  )
}
function DatesSection({ contract }: { contract: Contract }) {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>sección 6: plazo</Formulary.Title>
      </Formulary.Header>
      <Formulary.Field>
        <Formulary.Label htmlFor="start_date">
          fecha de inicio
        </Formulary.Label>
        <Formulary.Input
          id="start_date"
          name="start_date"
          type="datetime-local"
          defaultValue={
            contract.start_date
              ? format_date_for_input(contract.start_date)
              : undefined
          }
        />
      </Formulary.Field>
      <Formulary.Field>
        <Formulary.Label htmlFor="end_date">
          fecha de finalizacion
        </Formulary.Label>
        <Formulary.Input
          id="end_date"
          type="datetime-local"
          name="end_date"
          defaultValue={
            contract.end_date
              ? format_date_for_input(contract.end_date)
              : undefined
          }
        />
      </Formulary.Field>
    </Formulary.Section>
  )
}
function EscalationSection({
  contract,
}: {
  contract: Contract
}) {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>sección 7: canon locativo</Formulary.Title>
      </Formulary.Header>
      <Formulary.Field>
        <Formulary.Label htmlFor="escalation_type">
          tipo
        </Formulary.Label>
        <Formulary.Select
          name="escalation_type"
          id="escalation_type"
          defaultValue={contract.escalation_type ?? undefined}
        >
          {Object.values(ESCALATION_TYPE).map((type) => {
            const id = `escalation_${type}`
            return (
              <option key={id} value={type}>
                {get_escalation_label(type)}
              </option>
            )
          })}
        </Formulary.Select>
      </Formulary.Field>
      <Formulary.Field>
        <Formulary.Label htmlFor="escalation_duration">
          cada
        </Formulary.Label>
        <Formulary.Select
          name="escalation_duration"
          id="escalation_duration"
          defaultValue={contract.escalation_duration ?? undefined}
        >
          {DURATIONS.map((duration) => {
            const id = `escalation_duration_${duration}`
            return (
              <option key={id} value={duration}>
                {get_duration_label(duration)}
              </option>
            )
          })}
        </Formulary.Select>
      </Formulary.Field>
    </Formulary.Section>
  )
}
function PaymentSection() {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>sección 8: forma de pago</Formulary.Title>
      </Formulary.Header>
      <Formulary.Field>
        <Formulary.Label htmlFor="cbu">cbu</Formulary.Label>
        <Formulary.Input id="cbu" name="cbu" type="text" />
      </Formulary.Field>
    </Formulary.Section>
  )
}
function FineSection({ contract }: { contract: Contract }) {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>sección 9: mora</Formulary.Title>
      </Formulary.Header>
      <Formulary.Field>
        <Formulary.Label htmlFor="fine_percentage">
          porcentaje
        </Formulary.Label>
        <Formulary.Input
          id="fine_percentage"
          name="fine_percentage"
          type="number"
          defaultValue={contract.fine_amount ?? undefined}
        />
      </Formulary.Field>
    </Formulary.Section>
  )
}
function ReturnsSection() {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>sección 14: devoluciones</Formulary.Title>
      </Formulary.Header>
      <Formulary.Field>
        <Formulary.Label htmlFor="devoluciones_percentage">
          porcentaje
        </Formulary.Label>
        <Formulary.Input
          id="devoluciones_percentage"
          name="devoluciones_percentage"
          type="number"
        />
      </Formulary.Field>
    </Formulary.Section>
  )
}
function EarlyTerminationSection({
  contract,
}: {
  contract: Contract
}) {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>sección 15: recesion anticipada</Formulary.Title>
      </Formulary.Header>
      <Formulary.Field>
        <Formulary.Label htmlFor="early_termination">
          descripcion
        </Formulary.Label>
        <textarea
          id="early_termination"
          name="early_termination"
          className="border border-gray-400 bg-gray-700 p-2"
          defaultValue={contract.early_termination ?? undefined}
        />
      </Formulary.Field>
    </Formulary.Section>
  )
}
function ShowingSection() {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>sección 16: muestra de propiedad</Formulary.Title>
      </Formulary.Header>
      <Formulary.Field>
        <Formulary.Label htmlFor="muestra_horas">
          cantidad de horas
        </Formulary.Label>
        <Formulary.Input
          id="muestra_horas"
          name="muestra_horas"
          type="number"
        />
      </Formulary.Field>
    </Formulary.Section>
  )
}
function JurisdictionSection() {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>sección 21: jurisdiccion</Formulary.Title>
      </Formulary.Header>
      <Formulary.Field>
        <Formulary.Label htmlFor="tribunal">
          tribunal
        </Formulary.Label>
        <Formulary.Select name="tribunal" id="tribunal">
          {Object.values(TRIBUNAL).map((type) => {
            const id = `tribunal_${type}`
            return (
              <option key={id} value={type}>
                {get_tribunal_label(type)}
              </option>
            )
          })}
        </Formulary.Select>
      </Formulary.Field>
    </Formulary.Section>
  )
}
function DocumentsSection({
  contract,
  contract_file_types,
}: {
  contract: Contract
  contract_file_types: number[]
}) {
  const file_input_ref = useRef<HTMLInputElement>(null)
  const form_ref = useRef<HTMLFormElement>(null)
  function handle_add_click() {
    file_input_ref.current?.click()
  }
  function handle_file_change() {
    form_ref.current?.requestSubmit()
  }
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>documentos</Formulary.Title>
        <Formulary.Actions>
          <Button type="button" onClick={handle_add_click}>
            agregar documento
          </Button>
        </Formulary.Actions>
      </Formulary.Header>
      <Form
        ref={form_ref}
        method="POST"
        encType="multipart/form-data"
      >
        <input
          type="hidden"
          value={contract.id}
          name="contract_id"
        />
        <input
          ref={file_input_ref}
          type="file"
          name="file"
          className="sr-only"
          onChange={handle_file_change}
        />
        <Formulary.Field>
          <Formulary.Label htmlFor="file_type">
            tipo
          </Formulary.Label>
          <Formulary.Select name="file_type" id="file_type" required>
            {contract_file_types.map((type) => {
              const id = `file_type_${type}`
              return (
                <option key={id} value={type}>
                  {get_contract_file_type_label(type)}
                </option>
              )
            })}
          </Formulary.Select>
        </Formulary.Field>
        <input
          type="hidden"
          name="intent"
          value={INTENT.CREATE_FILE}
        />
      </Form>
      <ul className="flex flex-col gap-2 list-none p-0 m-0">
        {contract.files.map((file) => {
          const id = `file_${file.basename}`
          const contract_type = v.parse(
            ContractFileTypeSchema,
            file.type,
          )
          return (
            <li key={id} className="flex items-center gap-4">
              <span className="font-bold">
                {get_contract_file_type_label(contract_type)}
              </span>
              <a href={`/files/${file.id}`}>{file.basename}</a>
              <Form method="POST">
                <input type="hidden" value={file.id} name="id" />
                <Button
                  type="submit"
                  name="intent"
                  value={INTENT.DESTROY_FILE}
                >
                  eliminar
                </Button>
              </Form>
            </li>
          )
        })}
      </ul>
    </Formulary.Section>
  )
}
function PeriodsSection({ contract }: { contract: Contract }) {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>períodos</Formulary.Title>
      </Formulary.Header>
      <ul className="flex flex-col gap-2 list-none p-0 m-0">
        {contract.periods.map((period) => {
          const id = `period_${period.start_date}`
          const is_first =
            contract.periods[0].start_date === period.start_date
          return (
            <li key={id} className="flex items-center gap-4">
              {is_first ? (
                <span className="font-bold">inicial</span>
              ) : null}
              <span>${period.price}</span>
            </li>
          )
        })}
      </ul>
    </Formulary.Section>
  )
}
