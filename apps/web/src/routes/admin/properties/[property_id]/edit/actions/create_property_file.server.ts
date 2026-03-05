import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import { now } from "$lib/server/now"
import { upsert_file } from "$lib/server/upsert_file"
import { PROPERTY_FILE_TYPE } from "$lib/property_file_type"

const InputSchema = v.object({
  file: v.instance(File),
})

export async function create_property_file(
  form_data: FormData,
  property_id: number,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        create_property_file: {
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
        .insertInto("property_file")
        .values({
          type: PROPERTY_FILE_TYPE.PHOTO,
          file_id,
          property_id,
          created_at: now,
          updated_at: now,
        })
        .returning("id")
        .executeTakeFirstOrThrow()
    }),
  )
  if (transaction_error) {
    logger.error(transaction_error.message, { property_id }, transaction_error)
    return [
      {
        create_property_file: {
          execution:
            "Error al crear el archivo de la propiedad",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
