import { query_builder } from "db/query_builder"
import { decrypt } from "$lib/server/encryption"

export async function fetch_administrator(
  property_id: number,
) {
  const administrator = await query_builder
    .selectFrom("user")
    .innerJoin("member", "member.user_id", "user.id")
    .innerJoin(
      "property_organization",
      "property_organization.organization_id",
      "member.organization_id",
    )
    .where((eb) =>
      eb.and([
        eb("member.role", "=", "admin"),
        eb(
          "property_organization.property_id",
          "=",
          property_id,
        ),
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
    name: decrypt(administrator.name),
    surname: decrypt(administrator.surname),
    phone_number: administrator.phone_number
      ? decrypt(administrator.phone_number)
      : null,
    document_number: administrator.document_number
      ? decrypt(administrator.document_number)
      : null,
  }
}
export type Administrator = Awaited<
  ReturnType<typeof fetch_administrator>
>
