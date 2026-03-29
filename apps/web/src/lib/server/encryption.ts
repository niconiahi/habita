import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function get_encryption_key(): Buffer {
  if (!process.env.ENCRYPTION_KEY)
    throw new Error("ENCRYPTION_KEY is not set")
  if (process.env.ENCRYPTION_KEY.length !== 64)
    throw new Error(
      "ENCRYPTION_KEY must be 64 hex characters (32 bytes)",
    )
  return Buffer.from(process.env.ENCRYPTION_KEY, "hex")
}

export function encrypt(plaintext: string): string {
  const key = get_encryption_key()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const auth_tag = cipher.getAuthTag()
  const combined = Buffer.concat([iv, encrypted, auth_tag])
  return combined.toString("base64")
}

export function decrypt(ciphertext: string): string {
  const key = get_encryption_key()
  const combined = Buffer.from(ciphertext, "base64")
  const iv = combined.subarray(0, IV_LENGTH)
  const auth_tag = combined.subarray(
    combined.length - AUTH_TAG_LENGTH,
  )
  const encrypted = combined.subarray(
    IV_LENGTH,
    combined.length - AUTH_TAG_LENGTH,
  )
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(auth_tag)
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])
  return decrypted.toString("utf8")
}
