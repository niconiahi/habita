import { query_builder } from "db/query_builder"
import { decrypt } from "$lib/server/encryption"

export async function fetch_owner(property_id: number) {
  const owner = await query_builder
    .selectFrom("user")
    .innerJoin("member", "member.user_id", "user.id")
    .innerJoin(
      "property_organization",
      "property_organization.organization_id",
      "member.organization_id",
    )
    .where((eb) =>
      eb.and([
        eb("member.role", "=", "owner"),
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
      "user.email",
    ])
    .executeTakeFirst()
  if (!owner) return undefined
  return {
    ...owner,
    name: decrypt(owner.name),
    surname: decrypt(owner.surname),
    phone_number: owner.phone_number
      ? decrypt(owner.phone_number)
      : null,
    document_number: owner.document_number
      ? decrypt(owner.document_number)
      : null,
  }
}
export type Owner = Awaited<ReturnType<typeof fetch_owner>>
