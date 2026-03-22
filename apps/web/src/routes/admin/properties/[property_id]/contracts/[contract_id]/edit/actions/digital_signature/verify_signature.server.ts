import { createHash } from "node:crypto"
import * as v from "valibot"
import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type"
import { safe_async } from "$lib/safe_async"
import {
  check_certificate,
  fetch_signed_document,
  verify_signature as api_verify_signature,
  API_FETCH_ERROR,
} from "$lib/server/digital_signature"
import { normalize_input } from "$lib/server/form"
import { fetch_landlord } from "$lib/server/landlord"
import { fetch_tenant } from "$lib/server/tenant"
import { logger } from "$lib/telemetry/logger"
import { query_builder } from "db/query_builder"

const PartySchema = v.picklist(["landlord", "tenant"])

const InputSchema = v.object({
  party: PartySchema,
})

export async function verify_signature(
  form_data: FormData,
  property_id: number,
  contract_id: number,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        verify_signature: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const person =
    input.party === "landlord"
      ? await fetch_landlord(property_id)
      : await fetch_tenant(property_id)
  if (!person?.cuil) {
    return [
      {
        verify_signature: {
          execution: "La persona no tiene CUIL configurado",
        },
      },
      null,
    ] as const
  }
  const [signature_error, signature] = await safe_async(
    query_builder
      .selectFrom("digital_signature")
      .where("contract_id", "=", contract_id)
      .select(["document_id"])
      .executeTakeFirst(),
  )
  if (signature_error) {
    logger.error(
      signature_error.message,
      {},
      signature_error,
    )
    return [
      {
        verify_signature: {
          execution: "Error al buscar la firma digital",
        },
      },
      null,
    ] as const
  }
  if (!signature?.document_id) {
    return [
      {
        verify_signature: {
          execution:
            "No se encontró la firma digital del contrato",
        },
      },
      null,
    ] as const
  }
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
          contract_id,
        )
        .where(
          "contract_file.type",
          "=",
          CONTRACT_FILE_TYPE.CONTRACT,
        )
        .select(["file.content"])
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
        verify_signature: {
          execution: "Error al buscar el PDF del contrato",
        },
      },
      null,
    ] as const
  }
  if (!contract_file) {
    return [
      {
        verify_signature: {
          execution: "No se encontró el PDF del contrato",
        },
      },
      null,
    ] as const
  }
  const original_hash = createHash("sha256")
    .update(Buffer.from(contract_file.content))
    .digest("hex")
  const [
    [certificate_error, certificate],
    [signed_document_error, signed_document],
  ] = await Promise.all([
    check_certificate(person.cuil),
    fetch_signed_document(signature.document_id),
  ])
  if (certificate_error) {
    if (
      certificate_error.type ===
      API_FETCH_ERROR.FETCH_FAILED
    ) {
      return [
        {
          verify_signature: {
            execution:
              "No se pudo conectar al servicio de certificados",
          },
        },
        null,
      ] as const
    }
    if (
      certificate_error.type === API_FETCH_ERROR.API_ERROR
    ) {
      return [
        {
          verify_signature: {
            execution:
              "Error en el servicio de certificados",
          },
        },
        null,
      ] as const
    }
    if (
      certificate_error.type ===
      API_FETCH_ERROR.JSON_PARSE_FAILED
    ) {
      return [
        {
          verify_signature: {
            execution:
              "Respuesta inválida del servicio de certificados",
          },
        },
        null,
      ] as const
    }
    if (
      certificate_error.type ===
      API_FETCH_ERROR.SCHEMA_VALIDATION_FAILED
    ) {
      return [
        {
          verify_signature: {
            execution:
              "Respuesta inesperada del servicio de certificados",
          },
        },
        null,
      ] as const
    }
    return [
      {
        verify_signature: {
          execution: "Error al obtener el certificado",
        },
      },
      null,
    ] as const
  }
  if (signed_document_error) {
    if (
      signed_document_error.type ===
      API_FETCH_ERROR.FETCH_FAILED
    ) {
      return [
        {
          verify_signature: {
            execution:
              "No se pudo conectar al servicio de documentos firmados",
          },
        },
        null,
      ] as const
    }
    if (
      signed_document_error.type ===
      API_FETCH_ERROR.API_ERROR
    ) {
      return [
        {
          verify_signature: {
            execution:
              "Error en el servicio de documentos firmados",
          },
        },
        null,
      ] as const
    }
    if (
      signed_document_error.type ===
      API_FETCH_ERROR.JSON_PARSE_FAILED
    ) {
      return [
        {
          verify_signature: {
            execution:
              "Respuesta inválida del servicio de documentos firmados",
          },
        },
        null,
      ] as const
    }
    if (
      signed_document_error.type ===
      API_FETCH_ERROR.SCHEMA_VALIDATION_FAILED
    ) {
      return [
        {
          verify_signature: {
            execution:
              "Respuesta inesperada del servicio de documentos firmados",
          },
        },
        null,
      ] as const
    }
    return [
      {
        verify_signature: {
          execution:
            "Error al obtener el documento firmado",
        },
      },
      null,
    ] as const
  }
  if (certificate.CodigoResultado !== 1) {
    return [
      {
        verify_signature: {
          execution:
            "No se pudo obtener el certificado de la persona",
        },
      },
      null,
    ] as const
  }

  const [verify_error, verify_result] =
    await api_verify_signature({
      CertificadoBase64:
        certificate.Datos.CertificadoDerBase64,
      HashSHA256Hexadecimal: original_hash,
      HashSHA256FirmadoHexadecimal:
        signed_document.Datos.HashSHA256FirmadoHexadecimal,
    })
  if (verify_error) {
    if (
      verify_error.type === API_FETCH_ERROR.FETCH_FAILED
    ) {
      return [
        {
          verify_signature: {
            execution:
              "No se pudo conectar al servicio de verificación",
          },
        },
        null,
      ] as const
    }
    if (verify_error.type === API_FETCH_ERROR.API_ERROR) {
      return [
        {
          verify_signature: {
            execution:
              "Error en el servicio de verificación",
          },
        },
        null,
      ] as const
    }
    if (
      verify_error.type ===
      API_FETCH_ERROR.JSON_PARSE_FAILED
    ) {
      return [
        {
          verify_signature: {
            execution:
              "Respuesta inválida del servicio de verificación",
          },
        },
        null,
      ] as const
    }
    if (
      verify_error.type ===
      API_FETCH_ERROR.SCHEMA_VALIDATION_FAILED
    ) {
      return [
        {
          verify_signature: {
            execution:
              "Respuesta inesperada del servicio de verificación",
          },
        },
        null,
      ] as const
    }
    return [
      {
        verify_signature: {
          execution: "Error al verificar la firma",
        },
      },
      null,
    ] as const
  }
  if (verify_result.CodigoResultado !== 1) {
    return [
      {
        verify_signature: {
          execution: verify_result.MensajeResultado,
        },
      },
      null,
    ] as const
  }
  return [null, null] as const
}
