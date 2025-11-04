import * as v from "valibot"
import { ForceNumberSchema } from "~/lib/server/force_number.server"
import { kv } from "~/lib/server/kv.server"
import { query_builder } from "~/lib/server/query_builder.server"
import type { Route } from "./+types/$id"

const FileSchema = v.object({
  content: v.pipe(
    v.string(),
    v.transform((string) => {
      return Buffer.from(string, "base64")
    }),
  ),
  mime: v.string(),
  basename: v.string(),
})

export function compose_file_cache_key(id: number) {
  return `file:${id}`
}

export async function loader({ params }: Route.LoaderArgs) {
  const id = v.parse(ForceNumberSchema, params.id)
  const key = compose_file_cache_key(id)
  // NOTE: comment on production
  kv.del(key)
  const fields_count = await kv.hlen(key)
  if (fields_count > 0) {
    const fields = await kv.hgetall(key).then((fields) => {
      if (fields === null) {
        throw new Error("fields can't be null")
      }
      return fields
    })
    const cached_file = v.parse(FileSchema, fields)
    return new Response(
      Uint8Array.from(cached_file.content),
      {
        headers: {
          "Content-Type": cached_file.mime,
          "Content-Disposition": `attachment; filename="${cached_file.basename}"`,
        },
      },
    )
  }
  const file = await query_builder
    .selectFrom("file")
    .select(["content", "basename", "mime"])
    .where("id", "=", id)
    .executeTakeFirst()
  if (!file) {
    throw new Error("no file exist for this id")
  }
  await kv.hmset(key, [
    "basename",
    file.basename,
    "content",
    file.content.toString("base64"),
    "mime",
    file.mime,
  ])
  return new Response(Uint8Array.from(file.content), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `attachment; filename="${file.basename}"`,
    },
  })
}
