import { useRef } from "react"
import { Form } from "react-router"
import * as v from "valibot"
import { Button } from "~/components/button"
import { Content } from "~/components/content"
import { Formulary } from "~/components/formulary"
import { Section } from "~/components/section"
import { require_auth } from "~/lib/auth.server"
import {
  ContractFileTypeSchema,
  get_contract_file_type_label,
  get_contract_file_types,
} from "~/lib/contract_file_type"
import { get_tribunal_label, TRIBUNAL } from "~/lib/court"
import { format_date_for_input } from "~/lib/date"
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
import { fetch_owner } from "~/lib/owner.server"
import { has_edit_access } from "~/lib/property_access.server"
import { get_property_destiny_label } from "~/lib/property_destiny"
import { fetch_tenant } from "~/lib/tenant.server"
import {
  fetch_property,
  type Property,
} from "~/routes/properties+/fetchers/property.server"
import type { Route } from "./+types/_index"
import * as actions from "./actions/index.server"
import {
  type Contract,
  fetch_contract,
} from "./fetchers/contract.server"

const INTENT = {
  UPDATE_CONTRACT: "update_contract",
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
  const { contract, property, contract_file_types } =
    loaderData
  return (
    <Content.Root>
      <Content.Title>Edición de contrato</Content.Title>
      <SectionTwo contract={contract} />
      <SectionThree
        contract={contract}
        property={property}
      />
      <SectionSix contract={contract} />
      <SectionSeven contract={contract} />
      <SectionEight contract={contract} />
      <SectionNine contract={contract} />
      <SectionFourteen contract={contract} />
      <SectionFifteen contract={contract} />
      <SectionSixteen contract={contract} />
      <SectionTwentyOne contract={contract} />
      <DocumentsSection
        contract={contract}
        contract_file_types={contract_file_types}
      />
      <PeriodsSection contract={contract} />
    </Content.Root>
  )
}

function SectionTwo({ contract }: { contract: Contract }) {
  return (
    <Content.Section>
      <Section.Header>
        <Section.Title>sección 2: estado</Section.Title>
      </Section.Header>
      <ul>
        {INVENTORY.map((item) => {
          const id = `inventory_${item.id}`
          return (
            <li key={id}>
              <Formulary.Fields>
                <Formulary.Field>
                  <Formulary.Label htmlFor="start_date">
                    Nombre del elemento
                  </Formulary.Label>
                  <Formulary.Input
                    id="name"
                    name="name"
                    defaultValue={item.name}
                  />
                </Formulary.Field>
              </Formulary.Fields>
              <Formulary.Root>
                <Formulary.Fields>
                  <input
                    type="hidden"
                    value={contract.id}
                    name="id"
                  />
                </Formulary.Fields>
                <Formulary.Actions>
                  <Button type="button">
                    {item.has_photo
                      ? "Cambiar foto"
                      : "Subir foto"}
                  </Button>
                  <Button type="button">
                    Eliminar objeto
                  </Button>
                </Formulary.Actions>
              </Formulary.Root>
            </li>
          )
        })}
      </ul>
    </Content.Section>
  )
}
function SectionThree({
  property,
  contract,
}: {
  property: Property
  contract: Contract
}) {
  return (
    <Content.Section>
      <Section.Header>
        <Section.Title>sección 3: destino</Section.Title>
      </Section.Header>
      <Formulary.Root method="POST">
        <Formulary.Fields>
          <input
            type="hidden"
            value={contract.id}
            name="id"
          />
          <Formulary.Field>
            <Formulary.Label htmlFor="destiny">
              Tipo
            </Formulary.Label>
            {property.destinies.map((destiny) => (
              <Formulary.Radio
                id="destiny"
                key={destiny}
                name="destiny"
                value={destiny}
                defaultChecked={
                  contract.destiny === destiny
                }
              >
                {get_property_destiny_label(destiny)}
              </Formulary.Radio>
            ))}
          </Formulary.Field>
        </Formulary.Fields>
        <Formulary.Actions>
          <Button
            type="submit"
            name="intent"
            value={INTENT.UPDATE_CONTRACT}
          >
            Guardar destino
          </Button>
        </Formulary.Actions>
      </Formulary.Root>
    </Content.Section>
  )
}
function SectionSix({ contract }: { contract: Contract }) {
  return (
    <Content.Section>
      <Section.Header>
        <Section.Title>sección 6: plazo</Section.Title>
      </Section.Header>
      <Formulary.Root method="POST">
        <Formulary.Fields>
          <input
            type="hidden"
            value={contract.id}
            name="id"
          />
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
                  ? format_date_for_input(
                      contract.start_date,
                    )
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
        </Formulary.Fields>
        <Formulary.Actions>
          <Button
            type="submit"
            name="intent"
            value={INTENT.UPDATE_CONTRACT}
          >
            Guardar plazo
          </Button>
        </Formulary.Actions>
      </Formulary.Root>
    </Content.Section>
  )
}
function SectionSeven({
  contract,
}: {
  contract: Contract
}) {
  return (
    <Content.Section>
      <Section.Header>
        <Section.Title>
          sección 7: canon locativo
        </Section.Title>
      </Section.Header>
      <Formulary.Root method="POST">
        <Formulary.Fields>
          <input
            type="hidden"
            value={contract.id}
            name="id"
          />
          <Formulary.Field>
            <Formulary.Label htmlFor="escalation_type">
              tipo
            </Formulary.Label>
            <Formulary.Select
              name="escalation_type"
              id="escalation_type"
              defaultValue={
                contract.escalation_type ?? undefined
              }
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
            </Formulary.Select>
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label htmlFor="escalation_duration">
              cada
            </Formulary.Label>
            <Formulary.Select
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
            </Formulary.Select>
          </Formulary.Field>
        </Formulary.Fields>
        <Formulary.Actions>
          <Button
            type="submit"
            name="intent"
            value={INTENT.UPDATE_CONTRACT}
          >
            Guardar valores
          </Button>
        </Formulary.Actions>
      </Formulary.Root>
    </Content.Section>
  )
}
function SectionEight({
  contract,
}: {
  contract: Contract
}) {
  return (
    <Content.Section>
      <Section.Header>
        <Section.Title>
          sección 8: forma de pago
        </Section.Title>
      </Section.Header>
      <Formulary.Root method="POST">
        <Formulary.Fields>
          <input
            type="hidden"
            value={contract.id}
            name="id"
          />
          <Formulary.Field>
            <Formulary.Label htmlFor="cbu">
              CBU
            </Formulary.Label>
            <Formulary.Input
              id="cbu"
              name="cbu"
              type="text"
            />
          </Formulary.Field>
        </Formulary.Fields>
        <Formulary.Actions>
          <Button
            type="submit"
            name="intent"
            value={INTENT.UPDATE_CONTRACT}
          >
            Guardar CBU
          </Button>
        </Formulary.Actions>
      </Formulary.Root>
    </Content.Section>
  )
}
function SectionNine({ contract }: { contract: Contract }) {
  return (
    <Content.Section>
      <Section.Header>
        <Section.Title>sección 9: mora</Section.Title>
      </Section.Header>
      <Formulary.Root method="POST">
        <Formulary.Fields>
          <input
            type="hidden"
            value={contract.id}
            name="id"
          />
          <Formulary.Field>
            <Formulary.Label htmlFor="fine_percentage">
              porcentaje
            </Formulary.Label>
            <Formulary.Input
              id="fine_percentage"
              name="fine_percentage"
              type="number"
              defaultValue={
                contract.fine_amount ?? undefined
              }
            />
          </Formulary.Field>
        </Formulary.Fields>
        <Formulary.Actions>
          <Button
            type="submit"
            name="intent"
            value={INTENT.UPDATE_CONTRACT}
          >
            Guardar porcentaje
          </Button>
        </Formulary.Actions>
      </Formulary.Root>
    </Content.Section>
  )
}
function SectionFourteen({
  contract,
}: {
  contract: Contract
}) {
  return (
    <Content.Section>
      <Section.Header>
        <Section.Title>
          sección 14: devoluciones
        </Section.Title>
      </Section.Header>
      <Formulary.Root method="POST">
        <Formulary.Fields>
          <input
            type="hidden"
            value={contract.id}
            name="id"
          />
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
        </Formulary.Fields>
        <Formulary.Actions>
          <Button
            type="submit"
            name="intent"
            value={INTENT.UPDATE_CONTRACT}
          >
            Guardar porcentaje
          </Button>
        </Formulary.Actions>
      </Formulary.Root>
    </Content.Section>
  )
}
function SectionFifteen({
  contract,
}: {
  contract: Contract
}) {
  return (
    <Content.Section>
      <Section.Header>
        <Section.Title>
          sección 15: recesion anticipada
        </Section.Title>
      </Section.Header>
      <Formulary.Root method="POST">
        <Formulary.Fields>
          <input
            type="hidden"
            value={contract.id}
            name="id"
          />
          <Formulary.Field>
            <Formulary.Label htmlFor="early_termination">
              descripcion
            </Formulary.Label>
            <Formulary.Textarea
              id="early_termination"
              name="early_termination"
              defaultValue={
                contract.early_termination ?? undefined
              }
            />
          </Formulary.Field>
        </Formulary.Fields>
        <Formulary.Actions>
          <Button
            type="submit"
            name="intent"
            value={INTENT.UPDATE_CONTRACT}
          >
            Guardar recesion anticipada
          </Button>
        </Formulary.Actions>
      </Formulary.Root>
    </Content.Section>
  )
}
function SectionSixteen({
  contract,
}: {
  contract: Contract
}) {
  return (
    <Content.Section>
      <Section.Header>
        <Section.Title>
          sección 16: muestra de propiedad
        </Section.Title>
      </Section.Header>
      <Formulary.Root method="POST">
        <Formulary.Fields>
          <input
            type="hidden"
            value={contract.id}
            name="id"
          />
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
        </Formulary.Fields>
        <Formulary.Actions>
          <Button
            type="submit"
            name="intent"
            value={INTENT.UPDATE_CONTRACT}
          >
            Guardar cantidad
          </Button>
        </Formulary.Actions>
      </Formulary.Root>
    </Content.Section>
  )
}
function SectionTwentyOne({
  contract,
}: {
  contract: Contract
}) {
  return (
    <Content.Section>
      <Section.Header>
        <Section.Title>
          sección 21: jurisdiccion
        </Section.Title>
      </Section.Header>
      <Formulary.Root method="POST">
        <Formulary.Fields>
          <input
            type="hidden"
            value={contract.id}
            name="id"
          />
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
        </Formulary.Fields>
        <Formulary.Actions>
          <Button
            type="submit"
            name="intent"
            value={INTENT.UPDATE_CONTRACT}
          >
            Guardar jurisdiccion
          </Button>
        </Formulary.Actions>
      </Formulary.Root>
    </Content.Section>
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
    <Content.Section>
      <Section.Header>
        <Section.Title>documentos</Section.Title>
        <Section.Actions>
          <Button type="button" onClick={handle_add_click}>
            agregar documento
          </Button>
          <Form method="POST">
            <input
              type="hidden"
              value={contract.id}
              name="id"
            />
            <Button
              type="submit"
              name="intent"
              value={INTENT.CREATE_PDF}
            >
              Generar contrato
            </Button>
          </Form>
        </Section.Actions>
      </Section.Header>
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
          <Formulary.Select
            name="file_type"
            id="file_type"
            required
          >
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
            <li
              key={id}
              className="flex items-center gap-4"
            >
              <span className="font-bold">
                {get_contract_file_type_label(
                  contract_type,
                )}
              </span>
              <a href={`/files/${file.id}`}>
                {file.basename}
              </a>
              <Form method="POST">
                <input
                  type="hidden"
                  value={file.id}
                  name="id"
                />
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
    </Content.Section>
  )
}
function PeriodsSection({
  contract,
}: {
  contract: Contract
}) {
  return (
    <Content.Section>
      <Section.Header>
        <Section.Title>períodos</Section.Title>
      </Section.Header>
      <ul className="flex flex-col gap-2 list-none p-0 m-0">
        {contract.periods.map((period) => {
          const id = `period_${period.start_date}`
          const is_first =
            contract.periods[0].start_date ===
            period.start_date
          return (
            <li
              key={id}
              className="flex items-center gap-4"
            >
              {is_first ? (
                <span className="font-bold">inicial</span>
              ) : null}
              <span>${period.price}</span>
            </li>
          )
        })}
      </ul>
    </Content.Section>
  )
}
