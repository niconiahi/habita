import { encrypt } from "../server/encryption"
import { query_builder } from "../../../db/query_builder"

export async function create_user(data: {
  name: string
  surname: string
  email: string
  document_number: number
  phone_number: string
}): Promise<number> {
  const now = new Date().toISOString()
  const existing = await query_builder
    .selectFrom("user")
    .select("id")
    .where("email", "=", data.email)
    .executeTakeFirst()
  if (existing) {
    console.log(
      `user ${data.email} already exists, skipping`,
    )
    return existing.id
  }
  const user = await query_builder
    .insertInto("user")
    .values({
      email: data.email,
      name: encrypt(data.name),
      surname: encrypt(data.surname),
      phone_number: encrypt(data.phone_number),
      document_number: encrypt(
        String(data.document_number),
      ),
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created user with id ${user.id}`)
  return user.id
}
