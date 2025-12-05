import { useLoaderData } from "react-router"
import * as v from "valibot"
import { require_auth } from "~/lib/auth.server"
import { error } from "~/lib/error.server"
import { ForceNumberSchema } from "~/lib/force_number"
import { ACCESS_TYPE } from "~/lib/access_type"
import { query_builder } from "~/lib/query_builder.server"
import { fetch_tenant_by_id } from "../fetchers/tenant.server"
import type { Route } from "./+types/_index"

export async function loader({
  request,
  params,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  const tenant_id = v.parse(ForceNumberSchema, params.tenant_id, {
    message: "tenant id should be a number",
  })

  const admin_property_ids = user.accesses
    .filter(
      (access) =>
        access.type === ACCESS_TYPE.OWNER ||
        access.type === ACCESS_TYPE.ADMINISTRATOR,
    )
    .map((access) => access.property_id)

  const tenant_access = await query_builder
    .selectFrom("access")
    .where("access.user_id", "=", tenant_id)
    .where("access.type", "=", ACCESS_TYPE.TENANT)
    .where("access.property_id", "in", admin_property_ids)
    .select(["access.id"])
    .executeTakeFirst()

  if (!tenant_access) {
    throw error(403, "not authorized")
  }

  const tenant = await fetch_tenant_by_id(tenant_id)

  if (!tenant) {
    throw error(404, "tenant not found")
  }

  return { tenant }
}

export default function TenantDetail() {
  const { tenant } = useLoaderData<typeof loader>()

  const full_name = [tenant.name, tenant.surname]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {full_name || "Sin nombre"}
        </h1>
      </div>
      <div className="space-y-4">
        <div className="border rounded-lg p-4 space-y-2">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Nombre</p>
            <p>{full_name || "Sin nombre"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Email</p>
            <p>{tenant.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
