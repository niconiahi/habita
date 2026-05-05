import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { PropertyTagTypeSchema } from "$lib/property_tag_type"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
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
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  try {
    await query_builder.transaction().execute(async (tx) => {
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
    })
  } catch (error) {
    const typed_error =
      error instanceof Error
        ? error
        : new Error("unknown error")
    logger.error(
      typed_error.message,
      { property_id, tag_type: input.type },
      typed_error,
    )
    return fail(400, {
      message: "Error al actualizar el tag",
    })
  }
}
