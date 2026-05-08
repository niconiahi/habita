import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  positions: v.pipe(
    v.string(),
    v.transform((val) => JSON.parse(val)),
    v.array(
      v.object({
        room_id: v.number(),
        position_x: v.number(),
        position_y: v.number(),
      }),
    ),
  ),
})

export async function update_room_positions(
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
        for (const pos of input.positions) {
          await tx
            .insertInto("room_map")
            .values({
              room_id: pos.room_id,
              position_x: String(pos.position_x),
              position_y: String(pos.position_y),
              created_at: now,
              updated_at: now,
            })
            .onConflict((oc) =>
              oc.column("room_id").doUpdateSet({
                position_x: String(pos.position_x),
                position_y: String(pos.position_y),
                updated_at: now,
              }),
            )
            .execute()
        }
      })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { room_count: input.positions.length },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al guardar las posiciones del mapa",
    })
  }
}
