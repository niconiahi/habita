import { useLoaderData } from "react-router"
import { Card } from "~/components/card"
import { Content } from "~/components/content"
import { ACCESS_TYPE } from "~/lib/access_type"
import { require_auth } from "~/lib/auth.server"
import { display_name } from "~/lib/display_name"
import type { Route } from "./+types/$tenant_id"
import { fetch_tenant_by_id } from "./fetchers/tenant.server"

export async function loader({
  request,
  params,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  const tenant_id = Number(params.tenant_id)
  const admin_property_ids = user.accesses
    .filter(
      (access) =>
        access.type === ACCESS_TYPE.OWNER ||
        access.type === ACCESS_TYPE.ADMINISTRATOR,
    )
    .map((access) => access.property_id)
  if (admin_property_ids.length === 0) {
    throw new Response("No autorizado", { status: 403 })
  }
  const tenant = await fetch_tenant_by_id(tenant_id)
  if (!tenant) {
    throw new Response("Inquilino no encontrado", {
      status: 404,
    })
  }
  return { tenant }
}

export default function TenantProfile() {
  const { tenant } = useLoaderData<typeof loader>()
  return (
    <Content.Root>
      <Content.Title>Perfil del inquilino</Content.Title>
      <Content.Section>
        <Card.Root>
          <Card.Body>
            <Card.Title>Información de contacto</Card.Title>
            <Card.Content>
              {display_name(tenant)} · {tenant.email}
            </Card.Content>
          </Card.Body>
        </Card.Root>
      </Content.Section>
    </Content.Root>
  )
}
