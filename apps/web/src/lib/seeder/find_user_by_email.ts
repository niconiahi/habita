import { query_builder } from "../../../db/query_builder"

export async function find_user_by_email(
  email: string,
): Promise<number | null> {
  const user = await query_builder
    .selectFrom("user")
    .select("id")
    .where("email", "=", email)
    .executeTakeFirst()
  return user?.id ?? null
}
