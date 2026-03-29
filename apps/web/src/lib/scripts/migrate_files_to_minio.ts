import {
  createDecipheriv,
} from "node:crypto"
import { query_builder } from "db/query_builder"
import {
  put_object,
  object_exists,
  OBJECT_STORE_ERROR,
} from "$lib/server/object_store"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function decrypt_buffer(ciphertext: Buffer): Buffer {
  if (!process.env.ENCRYPTION_KEY)
    throw new Error("ENCRYPTION_KEY is not set")
  const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex")
  const iv = ciphertext.subarray(0, IV_LENGTH)
  const auth_tag = ciphertext.subarray(
    ciphertext.length - AUTH_TAG_LENGTH,
  )
  const encrypted = ciphertext.subarray(
    IV_LENGTH,
    ciphertext.length - AUTH_TAG_LENGTH,
  )
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(auth_tag)
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])
}

async function migrate_files_to_minio() {
  const files = await query_builder
    .selectFrom("file")
    .select(["id", "hash", "content", "mime"])
    .execute()

  const total = files.length
  console.log(`Found ${total} files to migrate`)

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const file of files) {
    const key = `files/${file.hash}`

    const [exists_error, exists] = await object_exists(key)
    if (exists_error) {
      console.error(
        `Failed to check existence for file ${file.id}: ${exists_error.error.message}`,
      )
      failed++
      continue
    }

    if (exists) {
      skipped++
      continue
    }

    const decrypted_content = decrypt_buffer(
      Buffer.from(file.content),
    )

    const [put_error] = await put_object(
      key,
      decrypted_content,
      file.mime,
    )
    if (put_error) {
      if (put_error.type === OBJECT_STORE_ERROR.PUT_FAILED) {
        console.error(
          `Failed to upload file ${file.id}: ${put_error.error.message}`,
        )
      }
      failed++
      continue
    }

    migrated++

    if ((migrated + skipped) % 10 === 0) {
      console.log(
        `Progress: ${migrated + skipped + failed}/${total} (migrated: ${migrated}, skipped: ${skipped}, failed: ${failed})`,
      )
    }
  }

  console.log(
    `Migration complete: ${migrated} migrated, ${skipped} skipped, ${failed} failed (${total} total)`,
  )

  if (failed > 0) {
    process.exit(1)
  }
}

migrate_files_to_minio()
