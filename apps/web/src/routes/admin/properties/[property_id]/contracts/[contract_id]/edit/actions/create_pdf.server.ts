import { createHash } from "node:crypto"
import * as v from "valibot"
import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type"
import { ForceNumberSchema } from "$lib/force_number"
import { compose_html, fetch_contract_data } from "$lib/server/contract/compose_html"
import { validate_contract_requirements } from "$lib/server/contract/validate_contract"
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
  const data = await fetch_contract_data(property_id, contract_id)
  const validation = validate_contract_requirements(
    data.contract,
    data.property,
    data.owner,
    data.tenant,
  )
  if (!validation.success) {
    return { errors: { create_pdf: validation.errors } }
  }
  const html = compose_html(
    validation.contract,
    validation.property,
    validation.owner,
    validation.tenant,
  )
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
  return null
}
