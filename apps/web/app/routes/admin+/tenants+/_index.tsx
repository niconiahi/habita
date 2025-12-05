import { Link, useLoaderData } from "react-router"
import { require_auth } from "~/lib/auth.server"
import { ACCESS_TYPE } from "~/lib/access_type"
import { display_location } from "~/lib/display_location"
import { fetch_tenants } from "./fetchers/tenants.server"
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
  const tenants = await fetch_tenants(admin_property_ids)
  return { tenants }
}

export default function Tenants() {
  const { tenants } = useLoaderData<typeof loader>()
  return (
    <>
      <h1 className="text-2xl font-bold">Inquilinos</h1>
      {tenants.length === 0 ? (
        <p>No hay inquilinos.</p>
      ) : (
        <Table.Root>
          <Table.Header>
            <Table.Cell header>Nombre</Table.Cell>
            <Table.Cell header>Email</Table.Cell>
            <Table.Cell header>Propiedad</Table.Cell>
            <Table.Cell header>Acciones</Table.Cell>
          </Table.Header>
          <Table.Body>
            {tenants.map((tenant) => {
              const full_name = [tenant.name, tenant.surname]
                .filter(Boolean)
                .join(" ")
              return (
                <Table.Row
                  key={`${tenant.id}-${tenant.property_id}`}
                >
                  <Table.Cell>{full_name}</Table.Cell>
                  <Table.Cell>{tenant.email}</Table.Cell>
                  <Table.Cell>
                    {display_location(tenant.location)}
                  </Table.Cell>
                  <Table.Cell>
                    <Link to={`/admin/tenants/${tenant.id}`}>
                      <Button>Ver perfil</Button>
                    </Link>
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
