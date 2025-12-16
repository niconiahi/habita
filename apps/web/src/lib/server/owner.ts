import { query_builder } from "$lib/server/db/query_builder";
import { ACCESS_TYPE } from "$lib/access_type";

export async function fetch_owner(property_id: number) {
  return query_builder
    .selectFrom("user")
    .innerJoin("access", "access.user_id", "user.id")
    .innerJoin("property", "property.id", "access.property_id")
    .where((eb) =>
      eb.and([
        eb("access.type", "=", ACCESS_TYPE.OWNER),
        eb("property.id", "=", property_id)
      ])
    )
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.phone_number",
      "user.document_number"
    ])
    .executeTakeFirst();
}
export type Owner = Awaited<ReturnType<typeof fetch_owner>>;
