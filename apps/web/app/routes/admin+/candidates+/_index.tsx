import { Link, useLoaderData } from "react-router"
import { Button } from "~/components/button"
import { Content } from "~/components/content"
import { Table } from "~/components/table"
import { ACCESS_TYPE } from "~/lib/access_type"
import { require_auth } from "~/lib/auth.server"
import { display_date } from "~/lib/display_date"
import { display_location } from "~/lib/display_location"
import { display_name } from "~/lib/display_name"
import type { Route } from "./+types/_index"
import { fetch_candidates } from "./fetchers/candidates.server"

export async function loader({
  request,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  const property_ids = user.accesses
    .filter(
      (access) =>
        access.type === ACCESS_TYPE.OWNER ||
        access.type === ACCESS_TYPE.ADMINISTRATOR,
    )
    .map((access) => access.property_id)
  const candidates = await fetch_candidates(property_ids)
  return { candidates }
}

export default function () {
  const { candidates } = useLoaderData<typeof loader>()
  return (
    <Content.Root>
      <Content.Title>Candidatos</Content.Title>
      <Content.Section>
        <Table.Root>
          <Table.Header>
            <Table.Cell header>Nombre</Table.Cell>
            <Table.Cell header>Fecha</Table.Cell>
            <Table.Cell header>Propiedad</Table.Cell>
            <Table.Cell header>Acciones</Table.Cell>
          </Table.Header>
          <Table.Body>
            {candidates.map((candidate) => (
              <Table.Row
                key={`${candidate.id}-${candidate.property_id}`}
              >
                <Table.Cell>
                  {display_name(candidate)}
                </Table.Cell>
                <Table.Cell>
                  {display_date(candidate.start_date)}
                </Table.Cell>
                <Table.Cell>
                  {display_location(candidate.location)}
                </Table.Cell>
                <Table.Cell>
                  <Link
                    to={`/admin/candidates/${candidate.id}`}
                  >
                    <Button>Ver perfil</Button>
                  </Link>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Content.Section>
    </Content.Root>
  )
}
