import { createHash } from "node:crypto"
import * as v from "valibot"
import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import {
  compose_html,
  fetch_contract_data,
} from "$lib/server/contract/compose_html"
import { validate_contract_requirements } from "$lib/server/contract/validate_contract"
import { now } from "$lib/server/now"
import {
  generate_pdf_with_playwright,
  GENERATE_PDF_WITH_PLAYWRIGHT_ERROR,
} from "$lib/server/pdf_generator"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import { query_builder } from "db/query_builder"

const InputSchema = v.object({
  id: ForceNumberSchema,
})

export async function create_pdf(
  form_data: FormData,
  property_id: number,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        create_pdf: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const data = await fetch_contract_data(
    property_id,
    input.id,
  )
  const validation = validate_contract_requirements(
    data.contract,
    data.property,
    data.landlord,
    data.tenant,
  )
  if (!validation.success) {
    return [
      { create_pdf: validation.errors },
      null,
    ] as const
  }
  if (!data.warranty) {
    return [
      {
        create_pdf: {
          warranty: "Falta la garantía del contrato",
        },
      },
      null,
    ] as const
  }
  const html = compose_html(
    validation.contract,
    validation.property,
    validation.landlord,
    validation.tenant,
    data.warranty,
  )
  const [pdf_error, content] =
    await generate_pdf_with_playwright(html)
  if (pdf_error) {
    if (
      pdf_error.type ===
      GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.FETCH_FAILED
    ) {
      return [
        {
          create_pdf: {
            execution:
              "No se pudo conectar al servicio de PDF",
          },
        },
        null,
      ] as const
    }
    if (
      pdf_error.type ===
      GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.SERVICE_ERROR
    ) {
      return [
        {
          create_pdf: {
            execution:
              "Error en el servicio de generación de PDF",
          },
        },
        null,
      ] as const
    }
    if (
      pdf_error.type ===
      GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.BUFFER_READ_FAILED
    ) {
      return [
        {
          create_pdf: {
            execution:
              "Error al leer el contenido del PDF generado",
          },
        },
        null,
      ] as const
    }
    return [
      {
        create_pdf: {
          execution: "Error al generar el PDF",
        },
      },
      null,
    ] as const
  }

  const [tx_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      const contract_file = await tx
        .selectFrom("contract_file")
        .select("file_id")
        .where((eb) =>
          eb.and([
            eb("type", "=", CONTRACT_FILE_TYPE.CONTRACT),
            eb("contract_id", "=", input.id),
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
          contract_id: input.id,
          created_at: now,
          updated_at: now,
        })
        .returning("id")
        .executeTakeFirstOrThrow()
    }),
  )
  if (tx_error) {
    logger.error(
      tx_error.message,
      { property_id, contract_id: input.id },
      tx_error,
    )
    return [
      {
        create_pdf: {
          execution: "Error al guardar el PDF del contrato",
        },
      },
      null,
    ] as const
  }
  logger.info("contract pdf generated", {
    property_id,
    contract_id: input.id,
  })

  return [null, null] as const
}
