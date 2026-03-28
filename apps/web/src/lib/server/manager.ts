import { query_builder } from "db/query_builder"
import { ACCESS_TYPE } from "$lib/access_type"
import { decrypt } from "$lib/server/encryption"

export async function fetch_manager(property_id: number) {
  const manager = await query_builder
    .selectFrom("user")
    .innerJoin(
      "property_access",
      "property_access.user_id",
      "user.id",
    )
    .where("property_access.property_id", "=", property_id)
    .where("property_access.type", "=", ACCESS_TYPE.MANAGER)
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.phone_number",
      "user.document_number",
    ])
    .executeTakeFirst()
  if (!manager) return undefined
  return {
    ...manager,
    name: decrypt(manager.name),
    surname: decrypt(manager.surname),
    phone_number: manager.phone_number
      ? decrypt(manager.phone_number)
      : null,
    document_number: manager.document_number
      ? decrypt(manager.document_number)
      : null,
  }
}
export type Manager = Awaited<
  ReturnType<typeof fetch_manager>
>
