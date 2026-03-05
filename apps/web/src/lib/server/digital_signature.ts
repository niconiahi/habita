import { pbkdf2Sync, createCipheriv } from "node:crypto"
import * as v from "valibot"
import { safe_async } from "$lib/safe_async"
import type { ObjectValues } from "$lib/compose_types"
import { logger } from "$lib/telemetry/logger"

export const API_FETCH_ERROR = {
  FETCH_FAILED: 0,
  API_ERROR: 1,
  JSON_PARSE_FAILED: 2,
  SCHEMA_VALIDATION_FAILED: 3,
} as const

// NOTE: newly added error
export type ApiFetchError = {
  type: ObjectValues<typeof API_FETCH_ERROR>
  error: Error
}

function get_config() {
  const username = process.env.DIGITAL_SIGNATURE_USERNAME
  const password = process.env.DIGITAL_SIGNATURE_PASSWORD
  const private_key =
    process.env.DIGITAL_SIGNATURE_PRIVATE_KEY
  const salt = process.env.DIGITAL_SIGNATURE_SALT
  const iv = process.env.DIGITAL_SIGNATURE_IV
  const user_id = process.env.DIGITAL_SIGNATURE_USER_ID
  const base_url = process.env.DIGITAL_SIGNATURE_BASE_URL
  if (!username)
    throw new Error("DIGITAL_SIGNATURE_USERNAME is not set")
  if (!password)
    throw new Error("DIGITAL_SIGNATURE_PASSWORD is not set")
  if (!private_key)
    throw new Error(
      "DIGITAL_SIGNATURE_PRIVATE_KEY is not set",
    )
  if (!salt)
    throw new Error("DIGITAL_SIGNATURE_SALT is not set")
  if (!iv)
    throw new Error("DIGITAL_SIGNATURE_IV is not set")
  if (!user_id)
    throw new Error("DIGITAL_SIGNATURE_USER_ID is not set")
  if (!base_url)
    throw new Error("DIGITAL_SIGNATURE_BASE_URL is not set")
  return {
    username,
    password,
    private_key,
    salt,
    iv,
    user_id,
    base_url,
  }
}

function encrypt_auth(
  auth_string: string,
  private_key: string,
  salt: string,
  iv: string,
): string {
  const plaintext_bytes = Buffer.from(auth_string, "utf8")
  const salt_bytes = Buffer.from(salt, "ascii")
  const derived_key = pbkdf2Sync(
    private_key,
    salt_bytes,
    1000,
    32,
    "sha1",
  )
  const iv_bytes = Buffer.from(iv, "ascii")
  const block_size = 16
  const size =
    Math.ceil(plaintext_bytes.length / block_size) *
    block_size
  const padded = Buffer.alloc(size, 0)
  plaintext_bytes.copy(padded)
  const cipher = createCipheriv(
    "aes-256-cbc",
    derived_key,
    iv_bytes,
  )
  cipher.setAutoPadding(false)
  const encrypted = Buffer.concat([
    cipher.update(padded),
    cipher.final(),
  ])
  return encrypted.toString("base64")
}

function make_auth_token(): string {
  const { username, password, private_key, salt, iv } =
    get_config()
  const today = new Date().toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  })
  const [dd, mm, yyyy] = today.split("/")
  const auth_string = `LOGIN|${dd}/${mm}/${yyyy}|${username}|${password}`
  return encrypt_auth(auth_string, private_key, salt, iv)
}

async function api_fetch<T>(
  endpoint: string,
  body: object,
  schema: v.GenericSchema<T>,
): Promise<[ApiFetchError, null] | [null, T]> {
  const { base_url, user_id } = get_config()
  // NOTE: new safe implementation
  const [fetch_error, response] = await safe_async(
    fetch(`${base_url}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: make_auth_token(),
        IdentificadorUsuario: user_id,
      },
      body: JSON.stringify(body),
    }),
  )
  if (fetch_error) {
    logger.error(
      fetch_error.message,
      { endpoint },
      fetch_error,
    )
    return [
      {
        type: API_FETCH_ERROR.FETCH_FAILED,
        error: fetch_error,
      },
      null,
    ]
  }

  if (!response.ok) {
    const error_text = await response.text()
    const api_error = new Error(
      `Digital signature API error (${endpoint}): ${error_text}`,
    )
    logger.error(api_error.message, { endpoint }, api_error)
    return [
      {
        type: API_FETCH_ERROR.API_ERROR,
        error: api_error,
      },
      null,
    ]
  }

  const [json_error, data] = await safe_async(
    response.json(),
  )
  if (json_error) {
    logger.error(
      json_error.message,
      { endpoint },
      json_error,
    )
    return [
      {
        type: API_FETCH_ERROR.JSON_PARSE_FAILED,
        error: json_error,
      },
      null,
    ]
  }

  const parsed_validation = v.safeParse(schema, data)
  if (!parsed_validation.success) {
    const parse_error = new Error("Schema validation failed")
    logger.error(
      parse_error.message,
      { endpoint },
      parse_error,
    )
    return [
      {
        type: API_FETCH_ERROR.SCHEMA_VALIDATION_FAILED,
        error: parse_error,
      },
      null,
    ]
  }
  const parsed = parsed_validation.output

  return [null, parsed]
}

const BaseResponseSchema = v.object({
  CodigoResultado: v.number(),
  MensajeResultado: v.string(),
})

const CheckCertificateResponseSchema = v.object({
  ...BaseResponseSchema.entries,
  Datos: v.object({
    Certificado: v.string(),
    ClavePublica: v.string(),
    CertificadoDerBase64: v.string(),
  }),
})

const AutorizacionSchema = v.object({
  IdentificadorPersonaDocumento: v.string(),
  CodigoUnicoIdentificacion: v.string(),
  CuitOrganizacion: v.nullable(v.string()),
  URLAutorizacion: v.string(),
  OrdenFirma: v.number(),
})

const SubmitForSigningResponseSchema = v.object({
  ...BaseResponseSchema.entries,
  Datos: v.object({
    IdentificadorDocumento: v.string(),
    IdentificadorGrupo: v.string(),
    Autorizaciones: v.array(AutorizacionSchema),
  }),
})

const EstadoPersonaSchema = v.object({
  CodigoUnicoIdentificacion: v.string(),
  CuitOrganizacion: v.nullable(v.string()),
  CodigoEstado: v.number(),
  DescripcionEstado: v.string(),
})

const UnsignedDocumentStatusResponseSchema = v.object({
  ...BaseResponseSchema.entries,
  Datos: v.object({
    CodigoEstado: v.number(),
    DescripcionEstado: v.string(),
    ArchivoFirmadoBase64: v.nullable(v.string()),
    HashSHA256FirmadoHexadecimal: v.nullable(v.string()),
    Estados: v.array(EstadoPersonaSchema),
  }),
})
const SignedDocumentStatusResponseSchema = v.object({
  ...BaseResponseSchema.entries,
  Datos: v.object({
    CodigoEstado: v.number(),
    DescripcionEstado: v.string(),
    ArchivoFirmadoBase64: v.string(),
    HashSHA256FirmadoHexadecimal: v.string(),
    Estados: v.array(EstadoPersonaSchema),
  }),
})

const VerifySignatureResponseSchema = v.object({
  ...BaseResponseSchema.entries,
})

const StartRegistrationResponseSchema = v.object({
  ...BaseResponseSchema.entries,
})

const StartOnboardingResponseSchema = v.object({
  ...BaseResponseSchema.entries,
})

export async function check_certificate(cuil: string) {
  return api_fetch(
    "/PostObtenerCertificado",
    {
      CodigoUnicoIdentificacion: cuil,
    },
    CheckCertificateResponseSchema,
  )
}

interface SubmitForSigningPersona {
  CodigoUnicoIdentificacion: string
  OrdenFirma: number
  UrlRedireccionOK: string
  UrlRedireccionError: string
  UrlRedireccionRechazar: string
}

interface SubmitForSigningParams {
  DocumentoBase64: string
  HashSHA256Hexadecimal: string
  IdentificadorGrupo: string
  Personas: SubmitForSigningPersona[]
  UserIdCreador: number
}

export async function submit_for_signing(
  params: SubmitForSigningParams,
) {
  return api_fetch(
    "/PostFirmarDocumentoFirmaDigital",
    params,
    SubmitForSigningResponseSchema,
  )
}

export async function fetch_unsigned_document_status(
  document_id: string,
) {
  return api_fetch(
    "/PostObtenerEstadoFirmaDigitalDocumento",
    {
      IdentificadorDocumento: document_id,
    },
    UnsignedDocumentStatusResponseSchema,
  )
}
export async function fetch_signed_document(
  document_id: string,
) {
  return api_fetch(
    "/PostObtenerEstadoFirmaDigitalDocumento",
    {
      IdentificadorDocumento: document_id,
    },
    SignedDocumentStatusResponseSchema,
  )
}

interface VerifySignatureParams {
  CertificadoBase64: string
  HashSHA256Hexadecimal: string
  HashSHA256FirmadoHexadecimal: string
}

export async function verify_signature(
  params: VerifySignatureParams,
) {
  return api_fetch(
    "/PostVerificarFirmaHash",
    params,
    VerifySignatureResponseSchema,
  )
}

export async function start_registration(email: string) {
  return api_fetch(
    "/PostIniciarRegistracionUsuario",
    {
      Email: email,
    },
    StartRegistrationResponseSchema,
  )
}

interface StartOnboardingParams {
  Email: string
  UrlRedireccionOK: string
  UrlRedireccionError: string
  UrlRedireccionRechazar: string
}

export async function start_onboarding(
  params: StartOnboardingParams,
) {
  const show_payment_step =
    process.env.NODE_ENV !== "development"
  return api_fetch(
    "/PostIniciarOnboardingPersonaFisica",
    { ...params, MostrarPasoPagar: show_payment_step },
    StartOnboardingResponseSchema,
  )
}
