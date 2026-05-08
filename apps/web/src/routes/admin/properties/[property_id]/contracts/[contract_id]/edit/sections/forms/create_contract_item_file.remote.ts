import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { now } from "$lib/server/now"
import { require_contract_edit_access_remote } from "$lib/server/auth/require_contract_edit_access_remote"
import { upsert_file } from "$lib/server/upsert_file"
import { logger } from "$lib/telemetry/logger"

export const create_contract_item_file = form(
  v.object({
    contract_item_id: RemoteNumberSchema,
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
    file: v.instance(File),
  }),
  async (input) => {
    await require_contract_edit_access_remote(input)
    try {
      await query_builder.transaction().execute(async (tx) => {
        const file_id = await upsert_file(input.file, tx)
        await tx
          .insertInto("contract_item_file")
          .values({
            file_id,
            contract_item_id: input.contract_item_id,
            created_at: now,
            updated_at: now,
          })
          .returning("id")
          .executeTakeFirstOrThrow()
      })
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          { contract_item_id: input.contract_item_id },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al crear el archivo del ítem")
    }
  },
)
