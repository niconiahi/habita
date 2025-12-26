import { sha256 } from "@oslojs/crypto/sha2"
import {
  encodeBase64url,
  encodeHexLowerCase,
} from "@oslojs/encoding"

export function make_token() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const token = encodeBase64url(bytes)
  return token
}

export function compose_token_hash(token: string) {
  return encodeHexLowerCase(
    sha256(new TextEncoder().encode(token)),
  )
}
