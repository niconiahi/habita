import { Link, useLoaderData } from "react-router"
import { require_auth } from "~/lib/auth.server"
import { ACCESS_TYPE } from "~/lib/access_type"
import { display_location } from "~/lib/display_location"
import { fetch_tenants } from "./fetchers/tenants.server"
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
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Inquilinos
        </h1>
      </div>
      {tenants.length === 0 ? (
        <p>No hay inquilinos.</p>
      ) : (
        <div className="space-y-4">
          {tenants.map((tenant) => {
            const full_name = [tenant.name, tenant.surname]
              .filter(Boolean)
              .join(" ")

            return (
              <div
                key={`${tenant.id}-${tenant.property_id}`}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Link
                      to={`/admin/tenants/${tenant.id}`}
                      className="text-lg font-semibold hover:underline"
                    >
                      {full_name || "Sin nombre"}
                    </Link>
                    <p className="text-sm text-gray-600">
                      {display_location(tenant.location)}
                    </p>
                  </div>
                  <Link
                    to={`/properties/${tenant.property_id}/edit`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Ver propiedad
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
