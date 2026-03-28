import { query_builder } from "db/query_builder"
import { ACCESS_TYPE } from "$lib/access_type"
import { decrypt } from "$lib/server/encryption"

export async function fetch_landlord(property_id: number) {
  const landlord = await query_builder
    .selectFrom("user")
    .innerJoin(
      "property_access",
      "property_access.user_id",
      "user.id",
    )
    .where("property_access.property_id", "=", property_id)
    .where(
      "property_access.type",
      "=",
      ACCESS_TYPE.LANDLORD,
    )
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.phone_number",
      "user.document_number",
      "user.cuil",
      "user.email",
    ])
    .executeTakeFirst()
  if (!landlord) return undefined
  return {
    ...landlord,
    name: decrypt(landlord.name),
    surname: decrypt(landlord.surname),
    phone_number: landlord.phone_number
      ? decrypt(landlord.phone_number)
      : null,
    document_number: landlord.document_number
      ? decrypt(landlord.document_number)
      : null,
    cuil: landlord.cuil ? decrypt(landlord.cuil) : null,
  }
}
export type Landlord = Awaited<
  ReturnType<typeof fetch_landlord>
>
