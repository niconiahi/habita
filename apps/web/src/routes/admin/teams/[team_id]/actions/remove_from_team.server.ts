import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { sql } from "kysely"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  user_id: ForceNumberSchema,
})

export async function remove_from_team(
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

  const property_count = await query_builder
    .selectFrom("property_access")
    .where("user_id", "=", input.user_id)
    .where("type", "=", ACCESS_TYPE.MANAGER)
    .select(sql<number>`count(*)::int`.as("count"))
    .executeTakeFirst()
  if ((property_count?.count ?? 0) > 0) {
    return fail(400, {
      message:
        "El gestor tiene propiedades asignadas. Reasignalas antes de removerlo del equipo.",
    })
  }

  try {
    await query_builder
      .deleteFrom("team_member")
      .where("team_id", "=", team_id)
      .where("user_id", "=", input.user_id)
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { team_id, user_id: input.user_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al remover del equipo",
    })
  }

  logger.info("user removed from team", {
    team_id,
    user_id: input.user_id,
  })
}
