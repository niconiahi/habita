import { createHash, randomUUID } from "node:crypto"
import * as v from "valibot"
import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type"
import { ForceNumberSchema } from "$lib/force_number"
import { SIGNATURE_STATUS } from "$lib/signature_status"
import { submit_for_signing } from "$lib/server/digital_signature"
import { fetch_landlord } from "$lib/server/landlord"
import { fetch_tenant } from "$lib/server/tenant"
import { get_origin } from "$lib/server/origin"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"

export async function send_for_signing(
  form_data: FormData,
  property_id: number,
) {
  const contract_id = v.parse(
    ForceNumberSchema,
    form_data.get("contract_id"),
  )
  const contract_file = await query_builder
    .selectFrom("contract_file")
    .innerJoin("file", "file.id", "contract_file.file_id")
    .where("contract_file.contract_id", "=", contract_id)
    .where(
      "contract_file.type",
      "=",
      CONTRACT_FILE_TYPE.CONTRACT,
    )
    .select(["file.content", "file.id as file_id"])
    .executeTakeFirst()
  if (!contract_file) {
    return {
      errors: {
        send_for_signing:
          "No se encontró el PDF del contrato",
      },
    }
  }
  const [landlord, tenant] = await Promise.all([
    fetch_landlord(property_id),
    fetch_tenant(property_id),
  ])
  if (!landlord?.cuil) {
    return {
      errors: {
        send_for_signing:
          "El locador no tiene CUIL configurado",
      },
    }
  }
  if (!tenant?.cuil) {
    return {
      errors: {
        send_for_signing:
          "El locatario no tiene CUIL configurado",
      },
    }
  }
  const pdf_buffer = Buffer.from(contract_file.content)
  const document_base64 = pdf_buffer.toString("base64")
  const hash_sha256 = createHash("sha256")
    .update(pdf_buffer)
    .digest("hex")
  const origin = get_origin()
  const base_path = `${origin}/webhooks/digital_signature/signing`
  const group_id = randomUUID()
  const result = await submit_for_signing({
    DocumentoBase64: document_base64,
    HashSHA256Hexadecimal: hash_sha256,
    IdentificadorGrupo: group_id,
    Personas: [
      {
        CodigoUnicoIdentificacion: landlord.cuil,
        OrdenFirma: 1,
        UrlRedireccionOK: `${base_path}?party=landlord&result=ok&contract_id=${contract_id}`,
        UrlRedireccionError: `${base_path}?party=landlord&result=error&contract_id=${contract_id}`,
        UrlRedireccionRechazar: `${base_path}?party=landlord&result=rejected&contract_id=${contract_id}`,
      },
      {
        CodigoUnicoIdentificacion: tenant.cuil,
        OrdenFirma: 2,
        UrlRedireccionOK: `${base_path}?party=tenant&result=ok&contract_id=${contract_id}`,
        UrlRedireccionError: `${base_path}?party=tenant&result=error&contract_id=${contract_id}`,
        UrlRedireccionRechazar: `${base_path}?party=tenant&result=rejected&contract_id=${contract_id}`,
      },
    ],
    UserIdCreador: 0,
  })
  if (result.CodigoResultado !== 1) {
    return {
      errors: {
        send_for_signing: result.MensajeResultado,
      },
    }
  }
  const landlord_auth = result.Datos.Autorizaciones.find(
    (a) => a.CodigoUnicoIdentificacion === landlord.cuil,
  )
  const tenant_auth = result.Datos.Autorizaciones.find(
    (a) => a.CodigoUnicoIdentificacion === tenant.cuil,
  )
  await query_builder
    .insertInto("digital_signature")
    .values({
      contract_id,
      document_id: result.Datos.IdentificadorDocumento,
      group_id: result.Datos.IdentificadorGrupo,
      landlord_url: landlord_auth?.URLAutorizacion ?? null,
      tenant_url: tenant_auth?.URLAutorizacion ?? null,
      landlord_status: SIGNATURE_STATUS.PENDING,
      tenant_status: SIGNATURE_STATUS.PENDING,
      created_at: now,
      updated_at: now,
    })
    .execute()
  const signatures_url = `${origin}/signatures`
  const email_html = `<p>Tiene un documento para firmar en Habita.</p><p><a href="${signatures_url}">Ver mis documentos</a></p>`
  const email_promises = [
    { email: landlord.email, name: landlord.name },
    { email: tenant.email, name: tenant.name },
  ].map(function send_signing_email(recipient) {
    return fetch("http://go:8081/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "html",
        to: {
          email: recipient.email,
          name: recipient.name,
        },
        subject: "Tiene un documento para firmar en Habita",
        html: email_html,
      }),
    })
  })
  await Promise.allSettled(email_promises)
  return null
}
