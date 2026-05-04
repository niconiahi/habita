import { json } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ conversation: null, messages: [] })
  }

  const conversation = await query_builder
    .selectFrom("conversation")
    .where("conversation.user_id", "=", locals.user.id)
    .select(["conversation.id", "conversation.created_at"])
    .executeTakeFirst()

  if (!conversation) {
    return json({ conversation: null, messages: [] })
  }

  const messages = await query_builder
    .selectFrom("conversation_message")
    .where(
      "conversation_message.conversation_id",
      "=",
      conversation.id,
    )
    .select([
      "conversation_message.id",
      "conversation_message.user_id",
      "conversation_message.message",
      "conversation_message.created_at",
    ])
    .orderBy("conversation_message.created_at", "asc")
    .execute()

  return json({
    conversation: {
      id: conversation.id,
      user_id: locals.user.id,
    },
    messages,
  })
}
