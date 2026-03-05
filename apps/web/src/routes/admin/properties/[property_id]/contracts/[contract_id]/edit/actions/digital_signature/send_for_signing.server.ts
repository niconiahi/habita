import { createHash, randomUUID } from "node:crypto"
import * as v from "valibot"
import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type"
import { ForceNumberSchema } from "$lib/force_number"
import { safe_async } from "$lib/safe_async"
import { SIGNATURE_STATUS } from "$lib/signature_status"
import {
  submit_for_signing,
  API_FETCH_ERROR,
} from "$lib/server/digital_signature"
import { normalize_input } from "$lib/server/form"
import {
  send_email,
  SEND_EMAIL_ERROR,
} from "$lib/server/send_email"
import { fetch_landlord } from "$lib/server/landlord"
import { fetch_tenant } from "$lib/server/tenant"
import { get_origin } from "$lib/server/origin"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"
import { query_builder } from "db/query_builder"

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
    return [
      {
        send_for_signing: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const [contract_file_error, contract_file] =
    await safe_async(
      query_builder
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
        .select(["file.content", "file.id as file_id"])
        .executeTakeFirst(),
    )
  if (contract_file_error) {
    logger.error(
      contract_file_error.message,
      {},
      contract_file_error,
    )
    return [
      {
        send_for_signing: {
          execution:
            "Error al buscar el PDF del contrato",
        },
      },
      null,
    ] as const
  }
  if (!contract_file) {
    return [
      {
        send_for_signing: {
          execution:
            "No se encontró el PDF del contrato",
        },
      },
      null,
    ] as const
  }
  const [landlord, tenant] = await Promise.all([
    fetch_landlord(property_id),
    fetch_tenant(property_id),
  ])
  if (!landlord?.cuil) {
    return [
      {
        send_for_signing: {
          execution:
            "El locador no tiene CUIL configurado",
        },
      },
      null,
    ] as const
  }
  if (!tenant?.cuil) {
    return [
      {
        send_for_signing: {
          execution:
            "El locatario no tiene CUIL configurado",
        },
      },
      null,
    ] as const
  }
  const pdf_buffer = Buffer.from(contract_file.content)
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
      return [
        {
          send_for_signing: {
            execution:
              "No se pudo conectar al servicio de firma digital",
          },
        },
        null,
      ] as const
    }
    if (submit_error.type === API_FETCH_ERROR.API_ERROR) {
      return [
        {
          send_for_signing: {
            execution:
              "Error en el servicio de firma digital",
          },
        },
        null,
      ] as const
    }
    if (
      submit_error.type ===
      API_FETCH_ERROR.JSON_PARSE_FAILED
    ) {
      return [
        {
          send_for_signing: {
            execution:
              "Respuesta inválida del servicio de firma digital",
          },
        },
        null,
      ] as const
    }
    if (
      submit_error.type ===
      API_FETCH_ERROR.SCHEMA_VALIDATION_FAILED
    ) {
      return [
        {
          send_for_signing: {
            execution:
              "Respuesta inesperada del servicio de firma digital",
          },
        },
        null,
      ] as const
    }
    return [
      {
        send_for_signing: {
          execution:
            "Error al enviar para firma digital",
        },
      },
      null,
    ] as const
  }
  if (submit_result.CodigoResultado !== 1) {
    return [
      {
        send_for_signing: {
          execution:
            submit_result.MensajeResultado,
        },
      },
      null,
    ] as const
  }
  const landlord_auth =
    submit_result.Datos.Autorizaciones.find(
      (a) =>
        a.CodigoUnicoIdentificacion === landlord.cuil,
    )
  const tenant_auth =
    submit_result.Datos.Autorizaciones.find(
      (a) =>
        a.CodigoUnicoIdentificacion === tenant.cuil,
    )
  const [insert_error] = await safe_async(
    query_builder
      .insertInto("digital_signature")
      .values({
        contract_id: input.contract_id,
        document_id:
          submit_result.Datos.IdentificadorDocumento,
        group_id:
          submit_result.Datos.IdentificadorGrupo,
        landlord_url:
          landlord_auth?.URLAutorizacion ?? null,
        tenant_url:
          tenant_auth?.URLAutorizacion ?? null,
        landlord_status: SIGNATURE_STATUS.PENDING,
        tenant_status: SIGNATURE_STATUS.PENDING,
        created_at: now,
        updated_at: now,
      })
      .execute(),
  )
  if (insert_error) {
    logger.error(
      insert_error.message,
      {},
      insert_error,
    )
    return [
      {
        send_for_signing: {
          execution:
            "Error al guardar la firma digital",
        },
      },
      null,
    ] as const
  }
  const signatures_url = `${origin}/signatures`
  const email_html = `<p>Tiene un documento para firmar en Habita.</p><p><a href="${signatures_url}">Ver mis documentos</a></p>`
  await Promise.all(
    [
      { email: landlord.email, name: landlord.name },
      { email: tenant.email, name: tenant.name },
    ].map(async function send_signing_email(recipient) {
      const [email_error] = await send_email({
        type: "html",
        to: {
          email: recipient.email,
          name: recipient.name,
        },
        subject:
          "Tiene un documento para firmar en Habita",
        html: email_html,
      })
      if (email_error) {
        if (
          email_error.type ===
          SEND_EMAIL_ERROR.FETCH_FAILED
        ) {
          logger.error(
            email_error.error.message,
            {
              recipient_email: recipient.email,
              error_type: SEND_EMAIL_ERROR.FETCH_FAILED,
            },
            email_error.error,
          )
        }
        if (
          email_error.type ===
          SEND_EMAIL_ERROR.SERVICE_ERROR
        ) {
          logger.error(
            email_error.error.message,
            {
              recipient_email: recipient.email,
              error_type: SEND_EMAIL_ERROR.SERVICE_ERROR,
            },
            email_error.error,
          )
        }
      }
    }),
  )
  return [null, null] as const
}
