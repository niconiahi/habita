import { require_authentication } from "$lib/server/auth"
import { error, redirect } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_edit_access } from "$lib/server/property_access"
import type { LayoutServerLoad } from "./$types"
import { fetch_contract } from "./fetchers/contract.server"
import { fetch_property } from "./fetchers/property.server"
import { fetch_warranty } from "./fetchers/warranty.server"

async function fetch_signature(contract_id: number) {
  return query_builder
    .selectFrom("digital_signature")
    .where("contract_id", "=", contract_id)
    .select([
      "id",
      "contract_id",
      "document_id",
      "group_id",
      "landlord_url",
      "tenant_url",
      "landlord_status",
      "tenant_status",
      "created_at",
      "updated_at",
    ])
    .executeTakeFirst()
}

export const load: LayoutServerLoad = async ({
  request,
  locals,
  params,
}) => {
  require_authentication(locals)
  const contract_id = v.parse(
    ForceNumberSchema,
    params.contract_id,
    {
      message: "contract id should be a number",
    },
  )
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
    {
      message: "property id should be a number",
    },
  )
  await require_edit_access(
    request.headers,
    locals.user.id,
    property_id,
    locals.session.activeOrganizationId,
  )
  const [contract, property] = await Promise.all([
    fetch_contract(contract_id),
    fetch_property(property_id),
  ])
  if (!contract) {
    error(
      404,
      `contract does not exist for id ${contract_id}`,
    )
  }
  if (!property) {
    error(
      404,
      `property does not exist for id ${property_id}`,
    )
  }
  const [warranty, signature] = await Promise.all([
    fetch_warranty(contract.warranty_id),
    fetch_signature(contract_id),
  ])
  return {
    contract,
    property,
    warranty,
    signature: signature ?? null,
  }
}
