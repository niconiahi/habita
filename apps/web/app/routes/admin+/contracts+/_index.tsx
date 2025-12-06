import { Link, redirect, useFetcher } from "react-router"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import * as v from "valibot"
import { require_auth } from "~/lib/auth.server"
import { ACCESS_TYPE } from "~/lib/access_type"
import {
  CONTRACT_STATE,
  ContractStateSchema,
  get_contract_state_label,
  get_contract_states,
} from "~/lib/contract_state"
import { display_location } from "~/lib/display_location"
import {
  fetch_contracts,
  type Contract,
} from "./fetchers/contracts.server"
import { Table } from "~/components/table"
import { Button } from "~/components/button"
import { Formulary } from "~/components/formulary"
import { error } from "~/lib/error.server"
import * as actions from "./actions/index.server"
import type { Route } from "./+types/_index"

const INTENT = {
  SET_STATE: "set_state",
} as const
export const IntentSchema = v.picklist(
  Object.values(INTENT),
)

export async function action({
  request,
}: Route.ActionArgs) {
  await require_auth(request)
  const form_data = await request.formData()
  const { output: intent, success } = v.safeParse(
    IntentSchema,
    form_data.get("intent"),
  )
  if (!success) {
    throw error(400, "intent is required")
  }
  switch (intent) {
    case INTENT.SET_STATE: {
      try {
        const { redirect_to } =
          await actions.set_state.execute(
            request,
            form_data,
          )
        return redirect(redirect_to)
      } catch (err) {
        if (err instanceof v.ValiError) {
          return {
            errors: {
              set_state: actions.set_state.get_errors(err),
            },
          }
        }
      }
    }
  }
  return null
}

export async function loader({
  request,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  const url = new URL(request.url)
  const state = v.parse(
    ContractStateSchema,
    Number(url.searchParams.get("state")),
  )
  const property_ids = user.accesses
    .filter(
      (access) =>
        access.type === ACCESS_TYPE.OWNER ||
        access.type === ACCESS_TYPE.ADMINISTRATOR,
    )
    .map((access) => access.property_id)
  const contracts = await fetch_contracts(property_ids, [
    state,
  ])
  return { contracts, state }
}

export default function Contracts({
  loaderData,
}: Route.ComponentProps) {
  const { contracts, state } = loaderData
  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <Link to="/admin/contracts/new">
          <Button>Nuevo contrato</Button>
        </Link>
      </div>
      <Filters state={state} />
      {contracts.length === 0 ? (
        <p>No hay contratos.</p>
      ) : (
        <ContractsTable contracts={contracts} />
      )}
    </>
  )
}

function format_end_date(end_date: Date | null) {
  if (!end_date) {
    return "Sin fecha de fin"
  }
  return format(
    new Date(end_date),
    "d 'de' MMMM 'de' yyyy",
    { locale: es },
  )
}

function ContractsTable({
  contracts,
}: {
  contracts: Contract[]
}) {
  const has_editable = contracts.some(
    (contract) => contract.state === CONTRACT_STATE.EDITING,
  )
  return (
    <Table.Root>
      <Table.Header>
        <Table.Cell header>Propiedad</Table.Cell>
        <Table.Cell header>Fecha de fin</Table.Cell>
        {has_editable ? (
          <Table.Cell header>Acciones</Table.Cell>
        ) : null}
      </Table.Header>
      <Table.Body>
        {contracts.map((contract) => {
          const is_editable =
            contract.state === CONTRACT_STATE.EDITING
          return (
            <Table.Row key={contract.id}>
              <Table.Cell>
                {display_location(contract.location)}
              </Table.Cell>
              <Table.Cell>
                {format_end_date(contract.end_date)}
              </Table.Cell>
              {has_editable ? (
                <Table.Cell>
                  {is_editable ? (
                    <Link
                      to={`/admin/properties/${contract.property_id}/contracts/${contract.id}/edit`}
                    >
                      <Button>Editar</Button>
                    </Link>
                  ) : null}
                </Table.Cell>
              ) : null}
            </Table.Row>
          )
        })}
      </Table.Body>
    </Table.Root>
  )
}

function Filters({ state }: { state: number }) {
  const fetcher = useFetcher()
  return (
    <fetcher.Form
      method="POST"
      onChange={(event) => {
        fetcher.submit(event.currentTarget)
      }}
    >
      <Formulary.Root label="Filtros">
        <Formulary.Section>
          <Formulary.Field>
            <Formulary.Label htmlFor="state">
              Estado
            </Formulary.Label>
            <Formulary.Select
              id="state"
              name="state"
              defaultValue={state}
            >
              {get_contract_states().map((state) => (
                <option key={state} value={state}>
                  {get_contract_state_label(state)}
                </option>
              ))}
            </Formulary.Select>
          </Formulary.Field>
        </Formulary.Section>
      </Formulary.Root>
      <input
        type="hidden"
        name="intent"
        value={INTENT.SET_STATE}
      />
    </fetcher.Form>
  )
}
