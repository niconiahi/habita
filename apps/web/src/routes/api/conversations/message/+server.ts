import * as v from "valibot"
import { json } from "@sveltejs/kit"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"
import type { RequestHandler } from "./$types"

const MessageInputSchema = v.object({
  message: v.pipe(v.string(), v.minLength(1)),
})

export const POST: RequestHandler = async ({
  request,
  locals,
}) => {
  if (!locals.user) {
    return json(
      { error: "Necesitás estar autenticado" },
      { status: 401 },
    )
  }

  const body = await request.json()
  const validation = v.safeParse(MessageInputSchema, body)
  if (!validation.success) {
    return json(
      { error: "Mensaje inválido" },
      { status: 400 },
    )
  }

  const user_id = locals.user.id

  const [find_error, existing_conversation] = await safe_async(
    query_builder
      .selectFrom("conversation")
      .where("conversation.user_id", "=", user_id)
      .select(["conversation.id"])
      .executeTakeFirst(),
  )
  if (find_error) {
    logger.error(find_error.message, {}, find_error)
    return json(
      { error: "Error al buscar la conversación" },
      { status: 500 },
    )
  }

  let conversation_id: number

  if (existing_conversation) {
    conversation_id = existing_conversation.id

    const [update_error] = await safe_async(
      query_builder
        .updateTable("conversation")
        .set({ updated_at: now })
        .where("conversation.id", "=", conversation_id)
        .execute(),
    )
    if (update_error) {
      logger.error(update_error.message, {}, update_error)
    }
  } else {
    const [create_error, new_conversation] = await safe_async(
      query_builder
        .insertInto("conversation")
        .values({
          user_id,
          created_at: now,
          updated_at: now,
        })
        .returning("conversation.id")
        .executeTakeFirstOrThrow(),
    )
    if (create_error) {
      logger.error(create_error.message, {}, create_error)
      return json(
        { error: "Error al crear la conversación" },
        { status: 500 },
      )
    }
    conversation_id = new_conversation.id
  }

  const [message_error, created_message] = await safe_async(
    query_builder
      .insertInto("conversation_message")
      .values({
        conversation_id,
        user_id,
        message: validation.output.message,
        created_at: now,
      })
      .returning([
        "conversation_message.id",
        "conversation_message.user_id",
        "conversation_message.message",
        "conversation_message.created_at",
      ])
      .executeTakeFirstOrThrow(),
  )
  if (message_error) {
    logger.error(message_error.message, {}, message_error)
    return json(
      { error: "Error al enviar el mensaje" },
      { status: 500 },
    )
  }

  return json({
    conversation_id,
    message: created_message,
  })
}
