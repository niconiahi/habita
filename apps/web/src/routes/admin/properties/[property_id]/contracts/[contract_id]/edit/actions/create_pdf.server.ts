import { createHash } from "node:crypto";
import * as v from "valibot";
import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type";
import { ForceNumberSchema } from "$lib/force_number";
import { now } from "$lib/server/now";
import { generate_pdf_with_playwright } from "$lib/server/pdf_generator";
import { query_builder } from "$lib/server/db/query_builder";
import { fetch_contract } from "../fetchers/contract.server";

// TODO: Implement full contract PDF template (migrated from React MDX)
function render_contract_html(
  contract: { id: number },
  property_id: number
): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { text-align: center; }
        </style>
      </head>
      <body>
        <h1>Contrato de Alquiler</h1>
        <p>Contrato ID: ${contract.id}</p>
        <p>Propiedad ID: ${property_id}</p>
        <p><em>Este es un contrato preliminar. La plantilla completa será implementada próximamente.</em></p>
      </body>
    </html>
  `;
}

export async function create_pdf(form_data: FormData, property_id: number) {
  const contract_id = v.parse(ForceNumberSchema, form_data.get("id"));
  const contract = await fetch_contract(contract_id);
  if (!contract) {
    throw new Error("contract should exist when creating pdf");
  }
  const html = render_contract_html(contract, property_id);
  const content = await generate_pdf_with_playwright(html);
  await query_builder.transaction().execute(async (tx) => {
    const contract_file_ = await tx
      .selectFrom("contract_file")
      .select("file_id")
      .where((eb) =>
        eb.and([
          eb("type", "=", CONTRACT_FILE_TYPE.CONTRACT),
          eb("contract_id", "=", contract_id)
        ])
      )
      .executeTakeFirst();
    if (contract_file_ !== undefined) {
      await tx
        .deleteFrom("file")
        .where("id", "=", contract_file_.file_id)
        .executeTakeFirstOrThrow();
    }
    const hash = createHash("sha256").update(content).digest("hex");
    const file = await tx
      .insertInto("file")
      .values({
        content,
        mime: "application/pdf",
        basename: "contract.pdf",
        created_at: now,
        updated_at: now,
        hash: hash,
        size: content.byteLength
      })
      .returning("id")
      .executeTakeFirstOrThrow();
    await tx
      .insertInto("contract_file")
      .values({
        file_id: file.id,
        type: CONTRACT_FILE_TYPE.CONTRACT,
        contract_id: contract_id,
        created_at: now,
        updated_at: now
      })
      .returning("id")
      .executeTakeFirstOrThrow();
  });
}
