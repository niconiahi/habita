import { createHash, randomBytes } from "crypto"

export function make_token() {
  return randomBytes(32).toString("base64url")
}

export function compose_token_hash(token: string) {
  return createHash("sha256").update(token).digest("hex")
}
