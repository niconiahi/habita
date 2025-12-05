import { Link, useLoaderData } from "react-router"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { require_auth } from "~/lib/auth.server"
import { ACCESS_TYPE } from "~/lib/access_type"
import { CONTRACT_STATE, get_contract_state_label } from "~/lib/contract_state"
import { display_location } from "~/lib/display_location"
import { fetch_contracts } from "./fetchers/contracts.server"
import { Table } from "~/components/table"
import { Button } from "~/components/button"
import type { Route } from "./+types/_index"

export async function loader({
  request,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  const admin_property_ids = user.accesses
    .filter(
      (access) =>
        access.type === ACCESS_TYPE.OWNER ||
        access.type === ACCESS_TYPE.ADMINISTRATOR,
    )
    .map((access) => access.property_id)
  const contracts = await fetch_contracts(admin_property_ids)
  return { contracts }
}

function format_end_date(end_date: Date | null) {
  if (!end_date) {
    return "Sin fecha de fin"
  }
  return format(new Date(end_date), "d 'de' MMMM 'de' yyyy", { locale: es })
}

export default function Contracts() {
  const { contracts } = useLoaderData<typeof loader>()
  return (
    <>
      <h1 className="text-2xl font-bold">Contratos</h1>
      {contracts.length === 0 ? (
        <p>No hay contratos.</p>
      ) : (
        <Table.Root>
          <Table.Header>
            <Table.Cell header>Propiedad</Table.Cell>
            <Table.Cell header>Estado</Table.Cell>
            <Table.Cell header>Fecha de fin</Table.Cell>
            <Table.Cell header>Acciones</Table.Cell>
          </Table.Header>
          <Table.Body>
            {contracts.map((contract) => {
              const is_editing =
                contract.state === CONTRACT_STATE.EDITING
              return (
                <Table.Row key={contract.id}>
                  <Table.Cell>
                    {display_location(contract.location)}
                  </Table.Cell>
                  <Table.Cell>
                    {get_contract_state_label(contract.state)}
                  </Table.Cell>
                  <Table.Cell>
                    {format_end_date(contract.end_date)}
                  </Table.Cell>
                  <Table.Cell>
                    {is_editing ? (
                      <Link
                        to={`/admin/properties/${contract.property_id}/contracts/${contract.id}/edit`}
                      >
                        <Button>Editar</Button>
                      </Link>
                    ) : (
                      "—"
                    )}
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Root>
      )}
    </>
  )
}
