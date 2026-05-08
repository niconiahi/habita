import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import {
  CONTRACT_FILE_TYPE,
} from "$lib/contract_file_type"
import { CONTRACT_STATE } from "$lib/contract_state"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"

export async function activate_contract(
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
      message: "El contrato ya está activo o finalizado",
    })
  }
  const contract_file = await query_builder
    .selectFrom("contract_file")
    .where("contract_id", "=", contract_id)
    .where("type", "=", CONTRACT_FILE_TYPE.CONTRACT)
    .select("id")
    .executeTakeFirst()
  if (!contract_file) {
    return fail(400, {
      message:
        "Generá el contrato antes de activarlo",
    })
  }

  try {
    await query_builder
      .updateTable("contract")
      .set({
        state: CONTRACT_STATE.ACTIVE,
        updated_at: now,
      })
      .where("id", "=", contract_id)
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, { contract_id }, error)
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al activar el contrato",
    })
  }
}
