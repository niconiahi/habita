import { createHash } from "node:crypto"
import * as v from "valibot"
import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type"
import {
  check_certificate,
  fetch_signed_document,
  verify_signature as api_verify_signature,
} from "$lib/server/digital_signature"
import { fetch_landlord } from "$lib/server/landlord"
import { fetch_tenant } from "$lib/server/tenant"
import { query_builder } from "db/query_builder"

const PartySchema = v.picklist(["landlord", "tenant"])

export async function verify_signature(
  form_data: FormData,
  property_id: number,
  contract_id: number,
) {
  const party = v.parse(PartySchema, form_data.get("party"))
  const person =
    party === "landlord"
      ? await fetch_landlord(property_id)
      : await fetch_tenant(property_id)
  if (!person?.cuil) {
    return {
      errors: {
        verify_signature:
          "La persona no tiene CUIL configurado",
      },
    }
  }
  const signature = await query_builder
    .selectFrom("digital_signature")
    .where("contract_id", "=", contract_id)
    .select(["document_id"])
    .executeTakeFirst()
  if (!signature?.document_id) {
    return {
      errors: {
        verify_signature:
          "No se encontró la firma digital del contrato",
      },
    }
  }
  const contract_file = await query_builder
    .selectFrom("contract_file")
    .innerJoin("file", "file.id", "contract_file.file_id")
    .where("contract_file.contract_id", "=", contract_id)
    .where(
      "contract_file.type",
      "=",
      CONTRACT_FILE_TYPE.CONTRACT,
    )
    .select(["file.content"])
    .executeTakeFirst()
  if (!contract_file) {
    return {
      errors: {
        verify_signature:
          "No se encontró el PDF del contrato",
      },
    }
  }
  const original_hash = createHash("sha256")
    .update(Buffer.from(contract_file.content))
    .digest("hex")
  const [certificate, signed_document] = await Promise.all([
    check_certificate(person.cuil),
    fetch_signed_document(signature.document_id),
  ])
  if (certificate.CodigoResultado !== 1) {
    return {
      errors: {
        verify_signature:
          "No se pudo obtener el certificado de la persona",
      },
    }
  }
  const result = await api_verify_signature({
    CertificadoBase64:
      certificate.Datos.CertificadoDerBase64,
    HashSHA256Hexadecimal: original_hash,
    HashSHA256FirmadoHexadecimal:
      signed_document.Datos.HashSHA256FirmadoHexadecimal,
  })
  if (result.CodigoResultado !== 1) {
    return {
      errors: {
        verify_signature: result.MensajeResultado,
      },
    }
  }
  return null
}
