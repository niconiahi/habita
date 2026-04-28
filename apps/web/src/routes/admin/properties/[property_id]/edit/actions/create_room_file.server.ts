import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { upsert_file } from "$lib/server/upsert_file"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  file: v.instance(File),
  room_id: ForceNumberSchema,
})

export async function create_room_file(
  form_data: FormData,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        create_room_file: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [transaction_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      const file_id = await upsert_file(input.file, tx)
      await tx
        .insertInto("room_file")
        .values({
          file_id,
          room_id: input.room_id,
          created_at: now,
          updated_at: now,
        })
        .returning("id")
        .executeTakeFirstOrThrow()
    }),
  )
  if (transaction_error) {
    logger.error(
      transaction_error.message,
      { room_id: input.room_id },
      transaction_error,
    )
    return [
      {
        create_room_file: {
          execution:
            "Error al agregar la foto a la habitación",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
