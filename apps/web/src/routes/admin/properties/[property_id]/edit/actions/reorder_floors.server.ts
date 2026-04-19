import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
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
    return [
      {
        reorder_floors: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
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

  const [transaction_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
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
    }),
  )
  if (transaction_error) {
    logger.error(
      transaction_error.message,
      { property_id },
      transaction_error,
    )
    return [
      {
        reorder_floors: {
          execution: "Error al reordenar los pisos",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}
