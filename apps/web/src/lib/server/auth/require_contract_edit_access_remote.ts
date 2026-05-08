import { getRequestEvent } from "$app/server"
import { error } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { CONTRACT_STATE } from "$lib/contract_state"
import { require_authentication } from "$lib/server/auth"
import { require_edit_access } from "$lib/server/property_access"

export async function require_contract_edit_access_remote(input: {
  property_id: number
  contract_id: number
}): Promise<void> {
  const { request, locals } = getRequestEvent()
  require_authentication(locals)
  await require_edit_access(
    request.headers,
    locals.user.id,
    input.property_id,
    locals.session.activeOrganizationId,
  )
  const contract = await query_builder
    .selectFrom("contract")
    .where("id", "=", input.contract_id)
    .select("state")
    .executeTakeFirst()
  if (!contract) {
    error(404, "Contrato no encontrado")
  }
  if (contract.state !== CONTRACT_STATE.EDITING) {
    error(
      400,
      "El contrato ya no es editable porque está activo",
    )
  }
}
