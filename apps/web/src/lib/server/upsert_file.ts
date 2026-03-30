import type { DB } from "db/types"
import type { Kysely, Transaction } from "kysely"
import { now } from "$lib/server/now"
import { put_object } from "$lib/server/object_store"

function compute_hash(content: Buffer): Promise<string> {
  return crypto.subtle
    .digest("SHA-256", new Uint8Array(content))
    .then((buffer) =>
      Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    )
}

export async function upsert_file(
  file: File,
  db: Kysely<DB> | Transaction<DB>,
) {
  const content = Buffer.from(await file.arrayBuffer())
  const hash = await compute_hash(content)

  const existing_file = await db
    .selectFrom("file")
    .select("id")
    .where("hash", "=", hash)
    .executeTakeFirst()
  if (existing_file) {
    return existing_file.id
  }

  const [put_error] = await put_object(
    `files/${hash}`,
    content,
    file.type,
  )
  if (put_error) {
    throw put_error.error
  }

  const inserted_file = await db
    .insertInto("file")
    .values({
      mime: file.type,
      basename: file.name,
      created_at: now,
      updated_at: now,
      hash,
      size: file.size,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  return inserted_file.id
}

export async function upsert_file_from_buffer(
  content: Buffer,
  basename: string,
  mime: string,
  db: Kysely<DB> | Transaction<DB>,
) {
  const hash = await compute_hash(content)

  const existing_file = await db
    .selectFrom("file")
    .select("id")
    .where("hash", "=", hash)
    .executeTakeFirst()
  if (existing_file) {
    return existing_file.id
  }

  const [put_error] = await put_object(
    `files/${hash}`,
    content,
    mime,
  )
  if (put_error) {
    throw put_error.error
  }

  const inserted_file = await db
    .insertInto("file")
    .values({
      mime,
      basename,
      created_at: now,
      updated_at: now,
      hash,
      size: content.byteLength,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  return inserted_file.id
}
