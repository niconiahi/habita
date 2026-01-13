import { query_builder } from "db/query_builder"
import { ACCESS_TYPE } from "$lib/access_type"
import { decrypt } from "$lib/server/encryption"

export async function fetch_owner(property_id: number) {
  const owner = await query_builder
    .selectFrom("user")
    .innerJoin("access", "access.user_id", "user.id")
    .innerJoin(
      "property",
      "property.id",
      "access.property_id",
    )
    .where((eb) =>
      eb.and([
        eb("access.type", "=", ACCESS_TYPE.OWNER),
        eb("property.id", "=", property_id),
      ]),
    )
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.phone_number",
      "user.document_number",
      "user.email",
    ])
    .executeTakeFirst()
  if (!owner) return undefined
  return {
    ...owner,
    phone_number: owner.phone_number ? decrypt(owner.phone_number) : null,
    document_number: owner.document_number
      ? decrypt(owner.document_number)
      : null,
  }
}
export type Owner = Awaited<ReturnType<typeof fetch_owner>>
