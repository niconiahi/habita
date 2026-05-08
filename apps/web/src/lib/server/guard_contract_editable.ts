import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { CONTRACT_STATE } from "$lib/contract_state"

export async function guard_contract_editable(
  contract_id: number,
) {
  const contract = await query_builder
    .selectFrom("contract")
    .where("id", "=", contract_id)
    .select("state")
    .executeTakeFirst()
  if (!contract) {
    return fail(404, { message: "Contrato no encontrado" })
  }
  if (contract.state !== CONTRACT_STATE.EDITING) {
    return fail(400, {
      message:
        "El contrato ya no es editable porque está activo",
    })
  }
  return null
}
