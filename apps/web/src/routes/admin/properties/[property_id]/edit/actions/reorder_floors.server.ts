import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  floor_ids: v.pipe(
    v.string(),
    v.transform((value) => JSON.parse(value)),
    v.array(ForceNumberSchema),
  ),
})

export async function reorder_floors(
  form_data: FormData,
  property_id: number,
) {
  const input_validation = v.safeParse(InputSchema, {
    floor_ids: form_data.get("floor_ids"),
  })
  if (!input_validation.success) {
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const { floor_ids } = input_validation.output

  // Fetch current floors to get their numbers
  const floors = await query_builder
    .selectFrom("floor")
    .select(["floor.id", "floor.number"])
    .where("floor.property_id", "=", property_id)
    .orderBy("floor.number", "asc")
    .execute()

  // The sorted numbers stay the same, but get reassigned
  // to the new floor order
  const sorted_numbers = floors
    .map((f) => f.number)
    .sort((a, b) => a - b)

  try {
    await query_builder.transaction().execute(async (tx) => {
      for (let i = 0; i < floor_ids.length; i++) {
        await tx
          .updateTable("floor")
          .set({
            number: sorted_numbers[i],
            updated_at: now,
          })
          .where("floor.id", "=", floor_ids[i])
          .execute()
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { property_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al reordenar los pisos",
    })
  }
}
