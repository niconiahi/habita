import { createHash } from "node:crypto"
import * as v from "valibot"
import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type"
import { ForceNumberSchema } from "$lib/force_number"
import { compose_html } from "$lib/server/contract/compose_html"
import { now } from "$lib/server/now"
import { generate_pdf_with_playwright } from "$lib/server/pdf_generator"
import { query_builder } from "db/query_builder"

export async function create_pdf(
  form_data: FormData,
  property_id: number,
) {
  const contract_id = v.parse(
    ForceNumberSchema,
    form_data.get("id"),
  )
  const html = await compose_html(property_id, contract_id)
  const content = await generate_pdf_with_playwright(html)
  await query_builder.transaction().execute(async (tx) => {
    const contract_file = await tx
      .selectFrom("contract_file")
      .select("file_id")
      .where((eb) =>
        eb.and([
          eb("type", "=", CONTRACT_FILE_TYPE.CONTRACT),
          eb("contract_id", "=", contract_id),
        ]),
      )
      .executeTakeFirst()
    if (contract_file) {
      await tx
        .deleteFrom("file")
        .where("id", "=", contract_file.file_id)
        .executeTakeFirstOrThrow()
    }
    const hash = createHash("sha256")
      .update(content)
      .digest("hex")
    const file = await tx
      .insertInto("file")
      .values({
        content,
        mime: "application/pdf",
        basename: "contract.pdf",
        created_at: now,
        updated_at: now,
        hash: hash,
        size: content.byteLength,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
    await tx
      .insertInto("contract_file")
      .values({
        file_id: file.id,
        type: CONTRACT_FILE_TYPE.CONTRACT,
        contract_id: contract_id,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
  })
}
