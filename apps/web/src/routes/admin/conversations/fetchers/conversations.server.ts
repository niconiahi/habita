import { query_builder } from "db/query_builder"

export function fetch_conversations() {
  return query_builder
    .selectFrom("conversation")
    .innerJoin("user", "user.id", "conversation.user_id")
    .select([
      "conversation.id",
      "conversation.user_id",
      "conversation.updated_at",
      "user.email as user_email",
    ])
    .orderBy("conversation.updated_at", "desc")
    .execute()
}
