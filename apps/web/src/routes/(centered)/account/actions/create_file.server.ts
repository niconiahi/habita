import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { upsert_file } from "$lib/server/upsert_file"
import { logger } from "$lib/telemetry/logger"
import { UserFileTypeSchema } from "$lib/user_file_type"

const InputSchema = v.object({
  file: v.instance(File),
  type: v.pipe(ForceNumberSchema, UserFileTypeSchema),
})

export async function create_file(
  form_data: FormData,
  user_id: number,
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
    await query_builder.transaction().execute(async (tx) => {
      const file_id = await upsert_file(input.file, tx)
      await tx
        .insertInto("user_file")
        .values({
          user_id,
          file_id,
          type: input.type,
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
        { user_id, file_type: input.type },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al crear el archivo",
    })
  }
}
