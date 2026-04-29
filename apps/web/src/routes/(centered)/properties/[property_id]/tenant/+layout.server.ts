import { require_authentication } from "$lib/server/auth"
import { error } from "@sveltejs/kit"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type"
import { CONTRACT_STATE } from "$lib/contract_state"
import { ForceNumberSchema } from "$lib/force_number"
import { require_property_access } from "$lib/server/property_access"
import { fetch_property } from "../../../../properties/fetchers/property.server"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({
  request,
  locals,
  params,
  url,
}) => {
  require_authentication(locals, url)
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
    {
      message: "property id should be a number",
    },
  )
  await require_property_access(
    request.headers,
    locals.user.id,
    property_id,
    [ACCESS_TYPE.TENANT],
    locals.session.activeOrganizationId,
    { property: ["read"] },
  )
  const property = await fetch_property(property_id)
  if (!property) {
    error(404, "Propiedad no encontrada")
  }
  const contract = property.contracts.find(
    (contract) =>
      contract.state === CONTRACT_STATE.ACTIVE,
  )
  if (!contract) {
    error(
      404,
      "No se encontró un contrato activo para esta propiedad",
    )
  }
  const manager =
    property.members.find(
      (member) => member.type === ACCESS_TYPE.MANAGER,
    ) ?? null
  const contract_files = contract.files.filter(
    (file) =>
      file.type === CONTRACT_FILE_TYPE.SIGNED ||
      file.type === CONTRACT_FILE_TYPE.CONTRACT,
  )
  const sorted_periods = [...contract.periods].sort(
    (a, b) => {
      const a_start = v.parse(v.string(), a.start_date)
      const b_start = v.parse(v.string(), b.start_date)
      return (
        new Date(a_start).getTime() -
        new Date(b_start).getTime()
      )
    },
  )
  const latest_period = contract.periods.sort((a, b) => {
    const b_start_date = v.parse(v.string(), b.start_date)
    const a_start_date = v.parse(v.string(), a.start_date)
    return (
      new Date(b_start_date).getTime() -
      new Date(a_start_date).getTime()
    )
  })[0]

  return {
    property_id,
    contract,
    manager,
    services: property.services,
    contract_files,
    contract_end_date: contract.end_date,
    periods: sorted_periods,
    current_rent_price: latest_period?.price ?? 0,
  }
}
