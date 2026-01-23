import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { kv } from "$lib/server/kv"
import { query_builder } from "db/query_builder"

function compose_file_cache_key(id: number) {
  return `file:${id}`
}

export async function destroy_contract_item(
  form_data: FormData,
) {
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  await query_builder.transaction().execute(async (tx) => {
    const contract_item_files = await tx
      .selectFrom("contract_item_file")
      .select("file_id")
      .where("contract_item_id", "=", id)
      .execute()

    await tx
      .deleteFrom("contract_item_file")
      .where("contract_item_id", "=", id)
      .execute()

    for (const contract_item_file of contract_item_files) {
      await tx
        .deleteFrom("file")
        .where("id", "=", contract_item_file.file_id)
        .execute()
      await kv.del(
        compose_file_cache_key(contract_item_file.file_id),
      )
    }

    await tx
      .deleteFrom("contract_item")
      .where("id", "=", id)
      .execute()
  })
}
