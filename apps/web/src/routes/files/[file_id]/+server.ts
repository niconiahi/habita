import { error } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { query_builder } from "db/query_builder"
import { kv } from "$lib/server/kv"
import type { RequestHandler } from "./$types"

const FileSchema = v.object({
  content: v.pipe(
    v.string(),
    v.transform((string) => Buffer.from(string, "base64")),
  ),
  mime: v.string(),
  basename: v.string(),
})

function compose_file_cache_key(id: number) {
  return `file:${id}`
}

export const GET: RequestHandler = async ({ params }) => {
  const file_id = v.parse(
    ForceNumberSchema,
    params.file_id,
    {
      message: "file id should be a number",
    },
  )
  const key = compose_file_cache_key(file_id)
  const fields_count = await kv.hlen(key)
  if (fields_count > 0) {
    const fields = await kv.hgetall(key)
    if (fields === null) {
      error(500, "cache fields can't be null")
    }
    const cached_file = v.parse(FileSchema, fields)
    return new Response(
      Uint8Array.from(cached_file.content),
      {
        headers: {
          "Content-Type": cached_file.mime,
          "Content-Disposition": `inline; filename="${cached_file.basename}"`,
        },
      },
    )
  }
  const file = await query_builder
    .selectFrom("file")
    .select(["content", "basename", "mime"])
    .where("id", "=", file_id)
    .executeTakeFirst()
  if (!file) {
    error(404, "file not found")
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
      "Content-Disposition": `inline; filename="${file.basename}"`,
    },
  })
}
