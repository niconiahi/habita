import { query_builder } from "~/lib/query_builder.server"

export async function fetch_user_files(user_id: number) {
  return query_builder
    .selectFrom("user_file")
    .innerJoin("file", "file.id", "user_file.file_id")
    .where("user_file.user_id", "=", user_id)
    .select(["user_file.id", "user_file.type", "file.basename"])
    .execute()
}
