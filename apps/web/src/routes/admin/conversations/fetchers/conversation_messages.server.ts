import { query_builder } from "db/query_builder"

export function fetch_conversation_messages(
  conversation_id: number,
) {
  return query_builder
    .selectFrom("conversation_message")
    .where(
      "conversation_message.conversation_id",
      "=",
      conversation_id,
    )
    .select([
      "conversation_message.id",
      "conversation_message.user_id",
      "conversation_message.message",
      "conversation_message.created_at",
    ])
    .orderBy("conversation_message.created_at", "asc")
    .execute()
}
