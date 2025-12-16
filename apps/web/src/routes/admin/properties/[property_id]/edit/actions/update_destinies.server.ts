import * as v from "valibot";
import { query_builder } from "$lib/server/db/query_builder";
import { now } from "$lib/server/now";
import { PropertyDestinySchema } from "$lib/property_destiny";

export async function update_destinies(
  form_data: FormData,
  property_id: number
) {
  const destinies = v.parse(
    v.array(PropertyDestinySchema),
    form_data.getAll("destiny").map(Number)
  );
  await query_builder
    .updateTable("property")
    .set({
      destinies,
      updated_at: now
    })
    .where("property.id", "=", property_id)
    .execute();
}
