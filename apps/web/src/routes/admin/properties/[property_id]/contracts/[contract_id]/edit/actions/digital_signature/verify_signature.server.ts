import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { fail } from "@sveltejs/kit"
import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type"
import {
  API_FETCH_ERROR,
  ApiFetchError,
  verify_signature as api_verify_signature,
  check_certificate,
  fetch_signed_document,
} from "$lib/server/digital_signature"
import { normalize_input } from "$lib/server/form"
import { fetch_landlord } from "$lib/server/landlord"
import { fetch_tenant } from "$lib/server/tenant"
import { logger } from "$lib/telemetry/logger"

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
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  const person =
    input.party === "landlord"
      ? await fetch_landlord(property_id)
      : await fetch_tenant(property_id)
  if (!person?.cuil) {
    return fail(400, {
      message: "La persona no tiene CUIL configurado",
    })
  }
  let signature: { document_id: string | null } | undefined
  try {
    signature = await query_builder
      .selectFrom("digital_signature")
      .where("contract_id", "=", contract_id)
      .select(["document_id"])
      .executeTakeFirst()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al buscar la firma digital",
    })
  }
  if (!signature?.document_id) {
    return fail(400, {
      message:
        "No se encontró la firma digital del contrato",
    })
  }
  let contract_file: { hash: string } | undefined
  try {
    contract_file = await query_builder
      .selectFrom("contract_file")
      .innerJoin("file", "file.id", "contract_file.file_id")
      .where("contract_file.contract_id", "=", contract_id)
      .where(
        "contract_file.type",
        "=",
        CONTRACT_FILE_TYPE.CONTRACT,
      )
      .select(["file.hash"])
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
  const original_hash = contract_file.hash

  let certificate: Awaited<
    ReturnType<typeof check_certificate>
  >
  let signed_document: Awaited<
    ReturnType<typeof fetch_signed_document>
  >
  try {
    ;[certificate, signed_document] = await Promise.all([
      check_certificate(person.cuil),
      fetch_signed_document(signature.document_id),
    ])
  } catch (error) {
    if (error instanceof ApiFetchError) {
      if (error.type === API_FETCH_ERROR.FETCH_FAILED) {
        return fail(400, {
          message:
            "No se pudo conectar al servicio de firma digital",
        })
      }
      if (error.type === API_FETCH_ERROR.API_ERROR) {
        return fail(400, {
          message: "Error en el servicio de firma digital",
        })
      }
      if (
        error.type === API_FETCH_ERROR.JSON_PARSE_FAILED
      ) {
        return fail(400, {
          message:
            "Respuesta inválida del servicio de firma digital",
        })
      }
      if (
        error.type ===
        API_FETCH_ERROR.SCHEMA_VALIDATION_FAILED
      ) {
        return fail(400, {
          message:
            "Respuesta inesperada del servicio de firma digital",
        })
      }
      return fail(400, {
        message: "Error al obtener datos de firma digital",
      })
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al obtener datos de firma digital",
    })
  }

  if (certificate.CodigoResultado !== 1) {
    return fail(400, {
      message:
        "No se pudo obtener el certificado de la persona",
    })
  }

  let verify_result: Awaited<
    ReturnType<typeof api_verify_signature>
  >
  try {
    verify_result = await api_verify_signature({
      CertificadoBase64:
        certificate.Datos.CertificadoDerBase64,
      HashSHA256Hexadecimal: original_hash,
      HashSHA256FirmadoHexadecimal:
        signed_document.Datos.HashSHA256FirmadoHexadecimal,
    })
  } catch (error) {
    if (error instanceof ApiFetchError) {
      if (error.type === API_FETCH_ERROR.FETCH_FAILED) {
        return fail(400, {
          message:
            "No se pudo conectar al servicio de verificación",
        })
      }
      if (error.type === API_FETCH_ERROR.API_ERROR) {
        return fail(400, {
          message: "Error en el servicio de verificación",
        })
      }
      if (
        error.type === API_FETCH_ERROR.JSON_PARSE_FAILED
      ) {
        return fail(400, {
          message:
            "Respuesta inválida del servicio de verificación",
        })
      }
      if (
        error.type ===
        API_FETCH_ERROR.SCHEMA_VALIDATION_FAILED
      ) {
        return fail(400, {
          message:
            "Respuesta inesperada del servicio de verificación",
        })
      }
      return fail(400, {
        message: "Error al verificar la firma",
      })
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al verificar la firma",
    })
  }

  if (verify_result.CodigoResultado !== 1) {
    return fail(400, {
      message: verify_result.MensajeResultado,
    })
  }
}
