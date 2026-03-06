import * as v from "valibot"
import { safe_async } from "$lib/safe_async"
import type { ObjectValues } from "$lib/compose_types"
import { logger } from "$lib/telemetry/logger"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"
import {
  make_token,
  compose_token_hash,
} from "$lib/server/token"

export const SEND_LANDLORD_INVITE_ERROR = {
  FETCH_FAILED: 0,
  SERVICE_ERROR: 1,
} as const

// NOTE: newly added error
type SendLandlordInviteError = {
  type: ObjectValues<typeof SEND_LANDLORD_INVITE_ERROR>
  error: Error
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

const InputSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  property_id: ForceNumberSchema,
})

export async function invite_landlord(form_data: FormData) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        invite_landlord: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const token = make_token()
  const token_hash = compose_token_hash(token)
  const expires_at = new Date(Date.now() + DAY_IN_MS * 7)

  const [insert_error] = await safe_async(
    query_builder
      .insertInto("invitation_token")
      .values({
        email: input.email,
        property_id: input.property_id,
        token: token_hash,
        created_at: now,
        expires_at,
      })
      .executeTakeFirstOrThrow(),
  )
  if (insert_error) {
    logger.error(insert_error.message, { property_id: input.property_id, email: input.email }, insert_error)
    return [
      {
        invite_landlord: {
          execution: "Error al crear la invitación",
        },
      },
      null,
    ] as const
  }

  const subject =
    "Estas siendo invitado como propietario de una propiedad"
  const url = new URL(
    `https://dev.habita.rent/properties/${input.property_id}/accept-invite`,
  )
  url.searchParams.set("token", token)
  const text = `
<div>
  <p>To accept, <a href="${url.toString()}">follow this link</a></p>
</div>`

  // Non-critical side effect: log errors but don't block the invite
  const [invite_error] = await send_landlord_invite({
    email: input.email,
    text,
    subject,
  })
  if (invite_error) {
    if (
      invite_error.type ===
      SEND_LANDLORD_INVITE_ERROR.FETCH_FAILED
    ) {
      logger.error(invite_error.error.message, {
        email: input.email,
        error_type: SEND_LANDLORD_INVITE_ERROR.FETCH_FAILED,
      }, invite_error.error)
    }
    if (
      invite_error.type ===
      SEND_LANDLORD_INVITE_ERROR.SERVICE_ERROR
    ) {
      logger.error(invite_error.error.message, {
        email: input.email,
        error_type: SEND_LANDLORD_INVITE_ERROR.SERVICE_ERROR,
      }, invite_error.error)
    }
  }

  logger.info("landlord invitation sent", {
    property_id: input.property_id,
    email: input.email,
  })

  return [null, null] as const
}

async function send_landlord_invite({
  email,
  subject,
  text,
}: {
  email: string
  subject: string
  text: string
}): Promise<
  [SendLandlordInviteError, null] | [null, null]
> {
  // NOTE: new safe implementation
  const [fetch_error, response] = await safe_async(
    fetch("http://go:8081/send-landlord-invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        subject,
        text,
      }),
    }),
  )
  if (fetch_error) {
    logger.error(
      fetch_error.message,
      { email },
      fetch_error,
    )
    return [
      {
        type: SEND_LANDLORD_INVITE_ERROR.FETCH_FAILED,
        error: fetch_error,
      },
      null,
    ]
  }

  if (!response.ok) {
    const error_text = await response.text()
    const invite_error = new Error(
      `Failed to send landlord invite: ${response.status} - ${error_text}`,
    )
    logger.error(
      invite_error.message,
      { email },
      invite_error,
    )
    return [
      {
        type: SEND_LANDLORD_INVITE_ERROR.SERVICE_ERROR,
        error: invite_error,
      },
      null,
    ]
  }

  return [null, null]
}
