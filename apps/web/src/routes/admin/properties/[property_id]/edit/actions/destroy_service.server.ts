import * as v from "valibot";
import { query_builder } from "$lib/server/db/query_builder";
import { ForceNumberSchema } from "$lib/force_number";

export async function destroy_service(form_data: FormData) {
  const id = v.parse(ForceNumberSchema, form_data.get("id"));
  await query_builder
    .deleteFrom("service")
    .where("service.id", "=", id)
    .execute();
}
