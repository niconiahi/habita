import * as v from "valibot"
import { query_builder } from "~/lib/query_builder.server"
import { ForceNumberSchema } from "~/lib/force_number"
import type { Route } from "./+types/$file_id"

export async function loader({ params }: Route.LoaderArgs) {
  const file_id = v.parse(ForceNumberSchema, params.file_id, {
    message: "file id should be a number",
  })

  const file = await query_builder
    .selectFrom("file")
    .where("file.id", "=", file_id)
    .select(["file.content", "file.mime", "file.basename"])
    .executeTakeFirst()

  if (!file) {
    throw new Response("File not found", { status: 404 })
  }

  return new Response(new Uint8Array(file.content), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `inline; filename="${file.basename}"`,
    },
  })
}
