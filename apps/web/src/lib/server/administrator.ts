import { query_builder } from "db/query_builder"
import { ACCESS_TYPE } from "$lib/access_type"
import { decrypt } from "$lib/server/encryption"

export async function fetch_administrator(property_id: number) {
  const administrator = await query_builder
    .selectFrom("user")
    .innerJoin("access", "access.user_id", "user.id")
    .innerJoin(
      "property",
      "property.id",
      "access.property_id",
    )
    .where((eb) =>
      eb.and([
        eb("access.type", "=", ACCESS_TYPE.ADMINISTRATOR),
        eb("property.id", "=", property_id),
      ]),
    )
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.phone_number",
      "user.document_number",
    ])
    .executeTakeFirst()
  if (!administrator) return undefined
  return {
    ...administrator,
    phone_number: administrator.phone_number
      ? decrypt(administrator.phone_number)
      : null,
    document_number: administrator.document_number
      ? decrypt(administrator.document_number)
      : null,
  }
}
export type Administrator = Awaited<ReturnType<typeof fetch_administrator>>
