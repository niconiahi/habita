import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { kv } from "$lib/server/kv"
import { query_builder } from "db/query_builder"

function compose_file_cache_key(id: number) {
  return `file:${id}`
}

export async function destroy_contract_item_file(
  form_data: FormData,
) {
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  const contract_item_id = v.parse(
    ForceNumberSchema,
    form_data.get("contract_item_id"),
  )
  await query_builder.transaction().execute(async (tx) => {
    await tx
      .deleteFrom("contract_item_file")
      .where((eb) =>
        eb.and([
          eb("contract_item_file.file_id", "=", id),
          eb(
            "contract_item_file.contract_item_id",
            "=",
            contract_item_id,
          ),
        ]),
      )
      .execute()
    await tx
      .deleteFrom("file")
      .where("file.id", "=", id)
      .execute()
  })
  const cache_key = compose_file_cache_key(id)
  await kv.del(cache_key)
}
