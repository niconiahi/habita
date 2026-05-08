import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { fail } from "@sveltejs/kit"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { publish_delete_object } from "$lib/server/broker/producer/publish_delete_object"
import {
  ObjectStoreError,
  delete_object,
} from "$lib/server/object_store"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  id: ForceNumberSchema,
})

export async function destroy_contract_item(
  form_data: FormData,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  const file_hashes = await query_builder
    .selectFrom("contract_item_file")
    .innerJoin(
      "file",
      "file.id",
      "contract_item_file.file_id",
    )
    .select(["file.id as file_id", "file.hash"])
    .where("contract_item_id", "=", input.id)
    .execute()

  try {
    await query_builder
      .transaction()
      .execute(async (tx) => {
        await tx
          .deleteFrom("contract_item_file")
          .where("contract_item_id", "=", input.id)
          .execute()

        for (const file_hash of file_hashes) {
          await tx
            .deleteFrom("file")
            .where("id", "=", file_hash.file_id)
            .execute()
        }

        await tx
          .deleteFrom("contract_item")
          .where("id", "=", input.id)
          .execute()
      })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { contract_item_id: input.id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al eliminar el ítem del contrato",
    })
  }

  for (const file_hash of file_hashes) {
    const shared = await query_builder
      .selectFrom("file")
      .where("hash", "=", file_hash.hash)
      .select("id")
      .executeTakeFirst()
    if (!shared) {
      const key = `files/${file_hash.hash}`
      try {
        await delete_object(key)
      } catch (error) {
        if (error instanceof ObjectStoreError) {
          logger.error(
            "failed to delete object, requeueing",
            { key },
            error,
          )
        } else {
          logger.unknown(error)
        }
        await publish_delete_object(key)
      }
    }
  }
}
