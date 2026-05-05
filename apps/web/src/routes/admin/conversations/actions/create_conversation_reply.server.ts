import * as v from "valibot"
import { fail } from "@sveltejs/kit"
import { normalize_input } from "$lib/server/form"

import { logger } from "$lib/telemetry/logger"
import { now } from "$lib/server/now"
import { send_email } from "$lib/server/send_email"
import { ForceNumberSchema } from "$lib/force_number"
import { query_builder } from "db/query_builder"

const InputSchema = v.object({
  conversation_id: ForceNumberSchema,
  message: v.pipe(v.string(), v.minLength(1)),
})

export async function create_conversation_reply(
  form_data: FormData,
  admin_user_id: number,
) {
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

  try {
    await query_builder
      .insertInto("conversation_message")
      .values({
        conversation_id: input.conversation_id,
        user_id: admin_user_id,
        message: input.message,
        created_at: now,
      })
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al enviar la respuesta",
    })
  }

  try {
    await query_builder
      .updateTable("conversation")
      .set({ updated_at: now })
      .where("conversation.id", "=", input.conversation_id)
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
    } else {
      logger.unknown(error)
    }
  }

  let conversation_user: { email: string }
  try {
    conversation_user = await query_builder
      .selectFrom("conversation")
      .innerJoin("user", "user.id", "conversation.user_id")
      .where("conversation.id", "=", input.conversation_id)
      .select(["user.email"])
      .executeTakeFirstOrThrow()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
    } else {
      logger.unknown(error)
    }
    return
  }

  const [email_error] = await send_email({
    to: { email: conversation_user.email, name: "" },
    subject: "Te respondimos en Habita",
    html: `<p>Te respondimos en Habita:</p><blockquote>${input.message}</blockquote><p><a href="https://dev.habita.rent">Volver a Habita</a></p>`,
  })
  if (email_error) {
    logger.error(
      "failed to send conversation reply email",
      {},
      email_error.error,
    )
  }
}
