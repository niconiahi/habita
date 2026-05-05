import { createHash, randomUUID } from "node:crypto"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { fail } from "@sveltejs/kit"
import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type"
import { ForceNumberSchema } from "$lib/force_number"
import { publish_send_signing_request } from "$lib/server/broker/producer/publish_send_signing_request"
import {
  API_FETCH_ERROR,
  submit_for_signing,
} from "$lib/server/digital_signature"
import { normalize_input } from "$lib/server/form"
import { fetch_landlord } from "$lib/server/landlord"
import { get_object } from "$lib/server/object_store"
import { now } from "$lib/server/now"
import { get_origin } from "$lib/server/origin"
import { fetch_tenant } from "$lib/server/tenant"
import { SIGNATURE_STATUS } from "$lib/signature_status"
import { logger } from "$lib/telemetry/logger"

const InputSchema = v.object({
  contract_id: ForceNumberSchema,
})

export async function send_for_signing(
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

  let contract_file: { hash: string; file_id: number } | undefined
  try {
    contract_file = await query_builder
      .selectFrom("contract_file")
      .innerJoin(
        "file",
        "file.id",
        "contract_file.file_id",
      )
      .where(
        "contract_file.contract_id",
        "=",
        input.contract_id,
      )
      .where(
        "contract_file.type",
        "=",
        CONTRACT_FILE_TYPE.CONTRACT,
      )
      .select(["file.hash", "file.id as file_id"])
      .executeTakeFirst()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al buscar el PDF del contrato",
    })
  }
  if (!contract_file) {
    return fail(400, {
      message: "No se encontró el PDF del contrato",
    })
  }
  const [object_error, pdf_content] = await get_object(
    `files/${contract_file.hash}`,
  )
  if (object_error) {
    return fail(400, {
      message: "Error al obtener el PDF del contrato",
    })
  }
  const [landlord, tenant] = await Promise.all([
    fetch_landlord(property_id),
    fetch_tenant(property_id),
  ])
  if (!landlord?.cuil) {
    return fail(400, {
      message: "El locador no tiene CUIL configurado",
    })
  }
  if (!tenant?.cuil) {
    return fail(400, {
      message: "El locatario no tiene CUIL configurado",
    })
  }
  const pdf_buffer = pdf_content
  const document_base64 = pdf_buffer.toString("base64")
  const hash_sha256 = createHash("sha256")
    .update(pdf_buffer)
    .digest("hex")
  const origin = get_origin()
  const base_path = `${origin}/webhooks/digital_signature/signing`
  const group_id = randomUUID()
  const [submit_error, submit_result] =
    await submit_for_signing({
      DocumentoBase64: document_base64,
      HashSHA256Hexadecimal: hash_sha256,
      IdentificadorGrupo: group_id,
      Personas: [
        {
          CodigoUnicoIdentificacion: landlord.cuil,
          OrdenFirma: 1,
          UrlRedireccionOK: `${base_path}?party=landlord&result=ok&contract_id=${input.contract_id}`,
          UrlRedireccionError: `${base_path}?party=landlord&result=error&contract_id=${input.contract_id}`,
          UrlRedireccionRechazar: `${base_path}?party=landlord&result=rejected&contract_id=${input.contract_id}`,
        },
        {
          CodigoUnicoIdentificacion: tenant.cuil,
          OrdenFirma: 2,
          UrlRedireccionOK: `${base_path}?party=tenant&result=ok&contract_id=${input.contract_id}`,
          UrlRedireccionError: `${base_path}?party=tenant&result=error&contract_id=${input.contract_id}`,
          UrlRedireccionRechazar: `${base_path}?party=tenant&result=rejected&contract_id=${input.contract_id}`,
        },
      ],
      UserIdCreador: 0,
    })
  if (submit_error) {
    if (
      submit_error.type === API_FETCH_ERROR.FETCH_FAILED
    ) {
      return fail(400, {
        message:
          "No se pudo conectar al servicio de firma digital",
      })
    }
    if (submit_error.type === API_FETCH_ERROR.API_ERROR) {
      return fail(400, {
        message:
          "Error en el servicio de firma digital",
      })
    }
    if (
      submit_error.type ===
      API_FETCH_ERROR.JSON_PARSE_FAILED
    ) {
      return fail(400, {
        message:
          "Respuesta inválida del servicio de firma digital",
      })
    }
    if (
      submit_error.type ===
      API_FETCH_ERROR.SCHEMA_VALIDATION_FAILED
    ) {
      return fail(400, {
        message:
          "Respuesta inesperada del servicio de firma digital",
      })
    }
    return fail(400, {
      message: "Error al enviar para firma digital",
    })
  }
  if (submit_result.CodigoResultado !== 1) {
    return fail(400, {
      message: submit_result.MensajeResultado,
    })
  }
  const landlord_auth =
    submit_result.Datos.Autorizaciones.find(
      (a) => a.CodigoUnicoIdentificacion === landlord.cuil,
    )
  const tenant_auth =
    submit_result.Datos.Autorizaciones.find(
      (a) => a.CodigoUnicoIdentificacion === tenant.cuil,
    )
  try {
    await query_builder
      .insertInto("digital_signature")
      .values({
        contract_id: input.contract_id,
        document_id:
          submit_result.Datos.IdentificadorDocumento,
        group_id: submit_result.Datos.IdentificadorGrupo,
        landlord_url:
          landlord_auth?.URLAutorizacion ?? null,
        tenant_url: tenant_auth?.URLAutorizacion ?? null,
        landlord_status: SIGNATURE_STATUS.PENDING,
        tenant_status: SIGNATURE_STATUS.PENDING,
        created_at: now,
        updated_at: now,
      })
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al guardar la firma digital",
    })
  }
  logger.info("contract sent for signing", {
    contract_id: input.contract_id,
    document_id: submit_result.Datos.IdentificadorDocumento,
  })

  const signatures_url = `${origin}/signatures`
  const email_html = `<p>Tiene un documento para firmar en Habita.</p><p><a href="${signatures_url}">Ver mis documentos</a></p>`

  await publish_send_signing_request(input.contract_id, {
    recipients: [
      { email: landlord.email, name: landlord.name },
      { email: tenant.email, name: tenant.name },
    ],
    subject: "Tiene un documento para firmar en Habita",
    html: email_html,
  })
}
