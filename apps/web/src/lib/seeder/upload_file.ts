import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import * as v from "valibot"
import { query_builder } from "../../../db/query_builder"
import { ensure_bucket, put_object } from "../server/s3"

function get_mime_type(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase()
  const mime_map: Record<string, string> = {
    pdf: "application/pdf",
    webp: "image/webp",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
  }
  return mime_map[ext || ""] || "application/octet-stream"
}

let bucket_ensured = false

export async function upload_file(
  path: string,
): Promise<number> {
  const now = new Date().toISOString()
  const content = await readFile(path)
  const hash = createHash("sha256")
    .update(content)
    .digest("hex")
  const basename = v.parse(
    v.string("basename is required"),
    path.split("/").pop(),
  )
  const mime = get_mime_type(path)
  const existing = await query_builder
    .selectFrom("file")
    .select("id")
    .where("hash", "=", hash)
    .executeTakeFirst()
  if (existing) {
    console.log(
      `file with hash ${hash} already exists, reusing`,
    )
    return existing.id
  }

  if (!bucket_ensured) {
    await ensure_bucket()
    bucket_ensured = true
  }
  await put_object(`files/${hash}`, content, mime)

  const file = await query_builder
    .insertInto("file")
    .values({
      mime,
      basename,
      size: content.length,
      hash,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created file with id ${file.id}`)
  return file.id
}
