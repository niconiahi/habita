import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
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
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  try {
    await query_builder
      .transaction()
      .execute(async (tx) => {
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
      })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { room_id: input.room_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al agregar la foto a la habitación",
    })
  }
}
