import type { Kysely, Transaction } from "kysely"
import type { DB } from "db/types"
import { now } from "$lib/server/now"

export async function upsert_file(
  file: File,
  db: Kysely<DB> | Transaction<DB>,
) {
  const content = Buffer.from(await file.arrayBuffer())
  const hash_buffer = await crypto.subtle.digest(
    "SHA-256",
    content,
  )
  const hash = Array.from(new Uint8Array(hash_buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  const existing_file = await db
    .selectFrom("file")
    .select("id")
    .where("hash", "=", hash)
    .executeTakeFirst()
  if (existing_file) {
    return existing_file.id
  }
  const inserted_file = await db
    .insertInto("file")
    .values({
      mime: file.type,
      basename: file.name,
      content,
      created_at: now,
      updated_at: now,
      hash,
      size: file.size,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  return inserted_file.id
}
