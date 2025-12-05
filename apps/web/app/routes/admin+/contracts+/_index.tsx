import { Link, useLoaderData } from "react-router"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { require_auth } from "~/lib/auth.server"
import { ACCESS_TYPE } from "~/lib/access_type"
import { CONTRACT_STATE } from "~/lib/contract_state"
import { display_location } from "~/lib/display_location"
import { fetch_contracts } from "./fetchers/contracts.server"
import { Card } from "~/components/card"
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
  return `Hasta ${format(new Date(end_date), "d 'de' MMMM 'de' yyyy", { locale: es })}`
}

export default function Contracts() {
  const { contracts } = useLoaderData<typeof loader>()
  return (
    <>
      <h1 className="text-2xl font-bold">Contratos</h1>
      {contracts.length === 0 ? (
        <p>No hay contratos.</p>
      ) : (
        <ul className="space-y-4">
          {contracts.map((contract) => {
            const is_editing =
              contract.state === CONTRACT_STATE.EDITING
            return (
              <li key={contract.id}>
                <Card.Root>
                  <Card.Body>
                    <Card.Title>
                      {display_location(contract.location)}
                    </Card.Title>
                    {is_editing ? (
                      <Card.Actions>
                        <Card.Action>
                          <Link
                            to={`/admin/properties/${contract.property_id}/contracts/${contract.id}/edit`}
                          >
                            <Button>Editar</Button>
                          </Link>
                        </Card.Action>
                      </Card.Actions>
                    ) : null}
                    <Card.Content>
                      {format_end_date(contract.end_date)}
                    </Card.Content>
                  </Card.Body>
                </Card.Root>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
