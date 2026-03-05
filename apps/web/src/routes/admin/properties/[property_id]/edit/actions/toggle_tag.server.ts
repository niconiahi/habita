import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { query_builder } from "db/query_builder"
import { now } from "$lib/server/now"
import { PropertyTagTypeSchema } from "$lib/property_tag_type"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  type: v.pipe(ForceNumberSchema, PropertyTagTypeSchema),
})

export async function toggle_tag(
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
        toggle_tag: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [transaction_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      const existing = await tx
        .selectFrom("property_tag")
        .select("property_tag.id")
        .where("property_tag.property_id", "=", property_id)
        .where("property_tag.type", "=", input.type)
        .executeTakeFirst()
      if (existing) {
        await tx
          .deleteFrom("property_tag")
          .where("property_tag.id", "=", existing.id)
          .execute()
      } else {
        await tx
          .insertInto("property_tag")
          .values({
            property_id,
            type: input.type,
            created_at: now,
            updated_at: now,
          })
          .execute()
      }
    }),
  )
  if (transaction_error) {
    logger.error(transaction_error.message, { property_id, tag_type: input.type }, transaction_error)
    return [
      {
        toggle_tag: {
          execution: "Error al actualizar el tag",
        },
      },
      null,
    ] as const
  }
  return [null, null] as const
}
