import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { normalize_input } from "$lib/server/form"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "El nombre es requerido"),
    v.maxLength(50, "Maximo 50 caracteres"),
  ),
})

export async function update_team_name(
  form_data: FormData,
  team_id: string,
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
      .updateTable("team")
      .set({ name: input.name, updated_at: new Date() })
      .where("id", "=", team_id)
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { team_id, name: input.name },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al actualizar el nombre del equipo",
    })
  }

  logger.info("team name updated", {
    team_id,
    name: input.name,
  })
}
