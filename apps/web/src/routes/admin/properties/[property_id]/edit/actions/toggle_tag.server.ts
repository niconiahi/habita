import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { now } from "$lib/server/now"
import { PropertyTagTypeSchema } from "$lib/property_tag_type"

export async function toggle_tag(
  form_data: FormData,
  property_id: number,
) {
  const type = v.parse(
    PropertyTagTypeSchema,
    Number(form_data.get("type")),
  )
  const existing = await query_builder
    .selectFrom("property_tag")
    .select("property_tag.id")
    .where("property_tag.property_id", "=", property_id)
    .where("property_tag.type", "=", type)
    .executeTakeFirst()
  if (existing) {
    await query_builder
      .deleteFrom("property_tag")
      .where("property_tag.id", "=", existing.id)
      .execute()
  } else {
    await query_builder
      .insertInto("property_tag")
      .values({
        property_id,
        type,
        created_at: now,
        updated_at: now,
      })
      .execute()
  }
}
