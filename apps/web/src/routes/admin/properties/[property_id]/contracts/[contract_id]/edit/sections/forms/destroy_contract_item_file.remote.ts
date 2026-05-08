import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form } from "$app/server"
import { query_builder } from "db/query_builder"
import { RemoteNumberSchema } from "$lib/remote_number"
import { publish_delete_object } from "$lib/server/broker/producer/publish_delete_object"
import {
  ObjectStoreError,
  delete_object,
} from "$lib/server/object_store"
import { require_contract_edit_access_remote } from "$lib/server/auth/require_contract_edit_access_remote"
import { logger } from "$lib/telemetry/logger"

export const destroy_contract_item_file = form(
  v.object({
    id: RemoteNumberSchema,
    contract_item_id: RemoteNumberSchema,
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
  }),
  async (input) => {
    await require_contract_edit_access_remote(input)
    const file = await query_builder
      .selectFrom("file")
      .select("hash")
      .where("id", "=", input.id)
      .executeTakeFirst()
    try {
      await query_builder.transaction().execute(async (tx) => {
        await tx
          .deleteFrom("contract_item_file")
          .where((eb) =>
            eb.and([
              eb("contract_item_file.file_id", "=", input.id),
              eb(
                "contract_item_file.contract_item_id",
                "=",
                input.contract_item_id,
              ),
            ]),
          )
          .execute()
        await tx
          .deleteFrom("file")
          .where("file.id", "=", input.id)
          .execute()
      })
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          {
            file_id: input.id,
            contract_item_id: input.contract_item_id,
          },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al eliminar el archivo del ítem")
    }
    if (file) {
      const shared = await query_builder
        .selectFrom("file")
        .where("hash", "=", file.hash)
        .select("id")
        .executeTakeFirst()
      if (!shared) {
        const key = `files/${file.hash}`
        try {
          await delete_object(key)
        } catch (err) {
          if (err instanceof ObjectStoreError) {
            logger.error(
              "failed to delete object, requeueing",
              { key },
              err,
            )
          } else {
            logger.unknown(err)
          }
          await publish_delete_object(key)
        }
      }
    }
    return { ok: true as const }
  },
)
