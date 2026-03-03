import { encrypt } from "../server/encryption"
import { query_builder } from "../../../db/query_builder"

function compute_cuil(document_number: number): string {
  const prefix = 20
  const dni = String(document_number).padStart(8, "0")
  const base = `${prefix}${dni}`
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number(base[i]) * weights[i]
  }
  let check = 11 - (sum % 11)
  if (check === 11) check = 0
  if (check === 10) check = 9
  return `${base}${check}`
}

export async function create_user(data: {
  name: string
  surname: string
  email: string
  document_number: number
  phone_number: string
  cuil?: string
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
  const cuil =
    data.cuil ?? compute_cuil(data.document_number)
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
      cuil: encrypt(cuil),
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created user with id ${user.id}`)
  return user.id
}
