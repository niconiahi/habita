import { query_builder } from "$lib/server/db/query_builder";
import { now } from "$lib/server/now";
import { SERVICE_TYPE } from "$lib/service";

export async function create_service(property_id: number) {
  await query_builder
    .insertInto("service")
    .values({
      code: "",
      type: SERVICE_TYPE.MUNICIPAL_FEE,
      updated_at: now,
      created_at: now,
      property_id
    })
    .execute();
}
