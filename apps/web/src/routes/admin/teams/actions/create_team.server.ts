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

export async function create_team(
  form_data: FormData,
  organization_id: string,
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

  const now = new Date()
  const id = crypto.randomUUID()

  try {
    await query_builder
      .insertInto("team")
      .values({
        id,
        name: input.name,
        organization_id,
        created_at: now,
        updated_at: now,
      })
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { name: input.name, organization_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al crear el equipo",
    })
  }

  logger.info("team created", {
    organization_id,
    team_id: id,
    name: input.name,
  })
}
