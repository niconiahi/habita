import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "~/lib/force_number"
import { kv } from "~/lib/kv.server"
import { compose_file_cache_key } from "~/routes/files+/$id"

export async function destroy_file(form_data: FormData) {
  const id = v.parse(ForceNumberSchema, form_data.get("id"))
  const contract_id = v.parse(
    ForceNumberSchema,
    form_data.get("contract_id"),
  )
  await query_builder.transaction().execute(async (tx) => {
    await tx
      .deleteFrom("contract_file")
      .where((eb) =>
        eb.and([
          eb("contract_file.file_id", "=", id),
          eb("contract_file.contract_id", "=", contract_id),
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
