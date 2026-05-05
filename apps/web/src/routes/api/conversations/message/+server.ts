import * as v from "valibot"
import { json } from "@sveltejs/kit"
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

  let existing_conversation: { id: number } | undefined
  try {
    existing_conversation = await query_builder
      .selectFrom("conversation")
      .where("conversation.user_id", "=", user_id)
      .select(["conversation.id"])
      .executeTakeFirst()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
    } else {
      logger.unknown(error)
    }
    return json(
      { error: "Error al buscar la conversación" },
      { status: 500 },
    )
  }

  let conversation_id: number

  if (existing_conversation) {
    conversation_id = existing_conversation.id

    try {
      await query_builder
        .updateTable("conversation")
        .set({ updated_at: now })
        .where("conversation.id", "=", conversation_id)
        .execute()
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message, {}, error)
      } else {
        logger.unknown(error)
      }
    }
  } else {
    try {
      const new_conversation = await query_builder
        .insertInto("conversation")
        .values({
          user_id,
          created_at: now,
          updated_at: now,
        })
        .returning("conversation.id")
        .executeTakeFirstOrThrow()
      conversation_id = new_conversation.id
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message, {}, error)
      } else {
        logger.unknown(error)
      }
      return json(
        { error: "Error al crear la conversación" },
        { status: 500 },
      )
    }
  }

  let created_message: {
    id: number
    user_id: number
    message: string
    created_at: Date
  }
  try {
    created_message = await query_builder
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
      .executeTakeFirstOrThrow()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
    } else {
      logger.unknown(error)
    }
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
