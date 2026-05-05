import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { fail } from "@sveltejs/kit"
import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type"
import { ForceNumberSchema } from "$lib/force_number"
import {
  compose_html,
  fetch_contract_data,
} from "$lib/server/contract/compose_html"
import { validate_contract_requirements } from "$lib/server/contract/validate_contract"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import {
  GENERATE_PDF_WITH_PLAYWRIGHT_ERROR,
  generate_pdf_with_playwright,
} from "$lib/server/pdf_generator"
import { upsert_file_from_buffer } from "$lib/server/upsert_file"
import { logger } from "$lib/telemetry/logger"

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
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
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
    return fail(400, validation.errors)
  }
  if (!data.warranty) {
    return fail(400, {
      message: "Falta la garantía del contrato",
    })
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
      return fail(400, {
        message:
          "No se pudo conectar al servicio de PDF",
      })
    }
    if (
      pdf_error.type ===
      GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.SERVICE_ERROR
    ) {
      return fail(400, {
        message:
          "Error en el servicio de generación de PDF",
      })
    }
    if (
      pdf_error.type ===
      GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.BUFFER_READ_FAILED
    ) {
      return fail(400, {
        message:
          "Error al leer el contenido del PDF generado",
      })
    }
    return fail(400, {
      message: "Error al generar el PDF",
    })
  }

  try {
    await query_builder.transaction().execute(async (tx) => {
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
      const file_id = await upsert_file_from_buffer(
        content,
        "contract.pdf",
        "application/pdf",
        tx,
      )
      await tx
        .insertInto("contract_file")
        .values({
          file_id,
          type: CONTRACT_FILE_TYPE.CONTRACT,
          contract_id: input.id,
          created_at: now,
          updated_at: now,
        })
        .returning("id")
        .executeTakeFirstOrThrow()
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { property_id, contract_id: input.id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al guardar el PDF del contrato",
    })
  }
  logger.info("contract pdf generated", {
    property_id,
    contract_id: input.id,
  })
}
