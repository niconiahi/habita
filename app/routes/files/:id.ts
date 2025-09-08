import { query_builder } from "~/lib/server/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "~/lib/server/force_number"
import type { Route } from "./+types/:id"

export async function loader({ params }: Route.LoaderArgs) {
  const id = v.parse(ForceNumberSchema, params.id)
  const file = await query_builder
    .selectFrom("file")
    .select(["content", "basename"])
    .where("id", "=", id)
    .executeTakeFirstOrThrow()
  return new Response(Uint8Array.from(file.content), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file.basename}"`,
    },
  })
}
