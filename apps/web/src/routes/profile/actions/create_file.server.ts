import { createHash } from "node:crypto"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"
import { UserFileTypeSchema } from "$lib/user_file_type"
import { query_builder } from "db/query_builder"

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
    return [
      {
        create_file: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [transaction_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      const content = Buffer.from(await input.file.bytes())
      const hash = createHash("sha256")
        .update(content)
        .digest("hex")
      const existing_file = await tx
        .selectFrom("file")
        .select("id")
        .where("hash", "=", hash)
        .executeTakeFirst()
      let file_id: number
      if (existing_file) {
        file_id = existing_file.id
      } else {
        const file = await tx
          .insertInto("file")
          .values({
            mime: input.file.type,
            basename: input.file.name,
            content,
            created_at: now,
            updated_at: now,
            hash,
            size: input.file.size,
          })
          .returning("id")
          .executeTakeFirstOrThrow()
        file_id = file.id
      }
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
    }),
  )
  if (transaction_error) {
    logger.error(transaction_error.message, { user_id, file_type: input.type }, transaction_error)
    return [
      {
        create_file: {
          execution: "Error al crear el archivo",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
