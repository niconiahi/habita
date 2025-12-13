import { Link, useLoaderData } from "react-router"
import { Button } from "~/components/button"
import { Content } from "~/components/content"
import { Section } from "~/components/section"
import { Table } from "~/components/table"
import { ACCESS_TYPE } from "~/lib/access_type"
import { require_auth } from "~/lib/auth.server"
import { display_location } from "~/lib/display_location"
import { get_property_state_label } from "~/lib/property_state"
import { get_property_type_label } from "~/lib/property_type"
import type { Route } from "./+types/_index"
import { fetch_properties } from "./fetchers/properties.server"

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
  const properties = await fetch_properties(property_ids)
  return { properties }
}

export default function () {
  const { properties } = useLoaderData<typeof loader>()
  return (
    <Content.Root>
      <Content.Title>Propiedades</Content.Title>
      <Content.Section>
        <Section.Header>
          <Section.Title>Propiedades</Section.Title>
          <Section.Actions>
            <Link to="/admin/properties/new">
              <Button>Nueva propiedad</Button>
            </Link>
          </Section.Actions>
        </Section.Header>
        <Table.Root>
          <Table.Header>
            <Table.Cell header>Ubicación</Table.Cell>
            <Table.Cell header>Tipo</Table.Cell>
            <Table.Cell header>Estado</Table.Cell>
            <Table.Cell header>Acciones</Table.Cell>
          </Table.Header>
          <Table.Body>
            {properties.map((property) => (
              <Table.Row key={property.id}>
                <Table.Cell>
                  {display_location(property.location)}
                </Table.Cell>
                <Table.Cell>
                  {get_property_type_label(property.type)}
                  {property.unit
                    ? ` - ${property.unit}`
                    : ""}
                </Table.Cell>
                <Table.Cell>
                  {get_property_state_label(property.state)}
                </Table.Cell>
                <Table.Cell>
                  <Link
                    to={`/admin/properties/${property.id}/edit`}
                  >
                    <Button>Editar</Button>
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
