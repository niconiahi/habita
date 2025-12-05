import { Link, useLoaderData } from "react-router"
import { require_auth } from "~/lib/auth.server"
import { ACCESS_TYPE } from "~/lib/access_type"
import { display_location } from "~/lib/display_location"
import { fetch_tenants } from "./fetchers/tenants.server"
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
        <ul className="space-y-4">
          {tenants.map((tenant) => {
            const full_name = [tenant.name, tenant.surname]
              .filter(Boolean)
              .join(" ")
            return (
              <li
                key={`${tenant.id}-${tenant.property_id}`}
              >
                <Card.Root>
                  <Card.Body>
                    <Card.Title>
                      {display_location(tenant.location)}
                    </Card.Title>
                    <Card.Actions>
                      <Card.Action>
                        <Link
                          to={`/admin/tenants/${tenant.id}`}
                        >
                          <Button>
                            Ver perfil
                          </Button>
                        </Link>
                      </Card.Action>
                    </Card.Actions>
                    <Card.Content>
                      {full_name} · {tenant.email}
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
