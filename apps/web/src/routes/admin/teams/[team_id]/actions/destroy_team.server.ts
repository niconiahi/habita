import { fail, redirect } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import { sql } from "kysely"
import { logger } from "$lib/telemetry/logger"

export async function destroy_team(team_id: string) {
  const member_count = await query_builder
    .selectFrom("team_member")
    .where("team_id", "=", team_id)
    .select(sql<number>`count(*)::int`.as("count"))
    .executeTakeFirst()
  if ((member_count?.count ?? 0) > 0) {
    return fail(400, {
      message:
        "El equipo tiene miembros. Removelos antes de eliminarlo.",
    })
  }

  try {
    await query_builder.transaction().execute(async (tx) => {
      await tx
        .deleteFrom("invitation")
        .where("team_id", "=", team_id)
        .execute()
      await tx
        .deleteFrom("team")
        .where("id", "=", team_id)
        .execute()
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, { team_id }, error)
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al eliminar el equipo",
    })
  }

  logger.info("team destroyed", { team_id })
  redirect(303, "/admin/teams")
}
