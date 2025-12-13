import { sha256 } from "@oslojs/crypto/sha2"
import {
  encodeBase64url,
  encodeHexLowerCase,
} from "@oslojs/encoding"
import * as v from "valibot"
import { ForceNumberSchema } from "~/lib/force_number"
import { now } from "~/lib/now.server"
import { query_builder } from "~/lib/query_builder.server"

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

const DAY_IN_MS = 24 * 60 * 60 * 1000

export async function invite_owner(form_data: FormData) {
  const email = v.parse(
    v.pipe(v.string(), v.email()),
    form_data.get("email"),
  )
  const property_id = v.parse(
    ForceNumberSchema,
    form_data.get("property_id"),
  )
  const token = make_token()
  const token_hash = compose_token_hash(token)
  const expires_at = new Date(Date.now() + DAY_IN_MS * 7)
  await query_builder
    .insertInto("invitation_token")
    .values({
      email,
      property_id,
      token: token_hash,
      created_at: now,
      expires_at,
    })
    .executeTakeFirstOrThrow()
  const subject =
    "Estas siendo invitado como dueño de una propiedad"
  const url = new URL(
    `https://dev.habita.rent/properties/${property_id}/accept-invite`,
  )
  url.searchParams.set("token", token)
  const text = `
<div>
  <p>To accept, <a href="${url.toString()}">follow this link</a></p>
</div>`
  await send_owner_invite({ email, text, subject })
}

async function send_owner_invite({
  email,
  subject,
  text,
}: {
  email: string
  subject: string
  text: string
}): Promise<void> {
  console.log("Attempting to send owner invite to:", email)
  try {
    const response = await fetch(
      "http://go:8081/send-owner-invite",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          subject,
          text,
        }),
      },
    )
    console.log("Response status:", response.status)
    if (!response.ok) {
      const error_text = await response.text()
      console.error(
        "Error response from Go service:",
        error_text,
      )
      throw new Error(
        `Failed to send owner invite: ${response.status} - ${error_text}`,
      )
    }
    console.log("Owner invite sent successfully")
  } catch (error) {
    console.error("Error sending owner invite:", error)
    throw new Error(
      "there was an error while sending the owner invite",
      { cause: error },
    )
  }
}
