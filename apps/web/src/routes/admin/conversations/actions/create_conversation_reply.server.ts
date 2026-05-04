import * as v from "valibot"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
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
    return [
      {
        create_conversation_reply: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [message_error] = await safe_async(
    query_builder
      .insertInto("conversation_message")
      .values({
        conversation_id: input.conversation_id,
        user_id: admin_user_id,
        message: input.message,
        created_at: now,
      })
      .execute(),
  )
  if (message_error) {
    logger.error(message_error.message, {}, message_error)
    return [
      {
        create_conversation_reply: {
          execution: "Error al enviar la respuesta",
        },
      },
      null,
    ] as const
  }

  const [update_error] = await safe_async(
    query_builder
      .updateTable("conversation")
      .set({ updated_at: now })
      .where("conversation.id", "=", input.conversation_id)
      .execute(),
  )
  if (update_error) {
    logger.error(update_error.message, {}, update_error)
  }

  const [user_error, conversation_user] = await safe_async(
    query_builder
      .selectFrom("conversation")
      .innerJoin("user", "user.id", "conversation.user_id")
      .where("conversation.id", "=", input.conversation_id)
      .select(["user.email"])
      .executeTakeFirstOrThrow(),
  )
  if (user_error) {
    logger.error(user_error.message, {}, user_error)
    return [null, null] as const
  }

  const [email_error] = await send_email({
    to: { email: conversation_user.email, name: "" },
    subject: "Te respondimos en Habita",
    text: `Te respondimos: "${input.message.slice(0, 100)}${input.message.length > 100 ? "..." : ""}"`,
    content: `<p>Te respondimos en Habita:</p><blockquote>${input.message}</blockquote><p><a href="https://dev.habita.rent">Volver a Habita</a></p>`,
  })
  if (email_error) {
    logger.error(
      "failed to send conversation reply email",
      {},
      email_error.error,
    )
  }

  return [null, null] as const
}
