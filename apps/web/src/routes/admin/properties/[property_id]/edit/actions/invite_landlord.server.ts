import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { publish_send_landlord_invite } from "$lib/server/broker/producer/publish_send_landlord_invite"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import {
  compose_token_hash,
  make_token,
} from "$lib/server/token"
import { logger } from "$lib/telemetry/logger"

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
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  const token = make_token()
  const token_hash = compose_token_hash(token)
  const expires_at = new Date(Date.now() + DAY_IN_MS * 7)

  let invitation_token: { id: number }
  try {
    invitation_token = await query_builder
      .insertInto("invitation_token")
      .values({
        email: input.email,
        property_id: input.property_id,
        token: token_hash,
        created_at: now,
        expires_at,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
  } catch (error) {
    const typed_error =
      error instanceof Error
        ? error
        : new Error("unknown error")
    logger.error(
      typed_error.message,
      {
        property_id: input.property_id,
        email: input.email,
      },
      typed_error,
    )
    return fail(400, {
      message: "Error al crear la invitación",
    })
  }

  const subject =
    "Estas siendo invitado como propietario de una propiedad"
  const url = new URL(
    `https://dev.habita.rent/properties/${input.property_id}/accept-invite`,
  )
  url.searchParams.set("token", token)
  const html = `
<div>
  <p>To accept, <a href="${url.toString()}">follow this link</a></p>
</div>`

  await publish_send_landlord_invite(
    input.property_id,
    invitation_token.id,
    {
      email: input.email,
      subject,
      html,
    },
  )

  logger.info("landlord invitation sent", {
    property_id: input.property_id,
    email: input.email,
  })
}
