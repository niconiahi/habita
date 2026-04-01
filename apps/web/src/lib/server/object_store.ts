import { createHmac, createHash } from "node:crypto"
import type { ObjectValues } from "$lib/compose_types"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

export const OBJECT_STORE_ERROR = {
  PUT_FAILED: 0,
  GET_FAILED: 1,
  DELETE_FAILED: 2,
  NOT_FOUND: 3,
} as const

export type ObjectStoreError = {
  type: ObjectValues<typeof OBJECT_STORE_ERROR>
  error: Error
}

const EMPTY_HASH =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

const S3_ALGORITHM = "AWS4-HMAC-SHA256"
// Required by S3 protocol, not AWS — us-east-1 is the S3 default region
const S3_REGION = "us-east-1"
const S3_SERVICE = "s3"
const S3_SIGNING_SUFFIX = "aws4_request"

function get_environment_variable(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

function get_base_url(): string {
  return `http://${get_environment_variable("OBJECT_STORE_ENDPOINT")}`
}

function get_bucket(): string {
  return get_environment_variable("OBJECT_STORE_BUCKET")
}

function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex")
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest()
}

function get_date_stamp(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "")
}

function get_amz_date(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+/, "")
}

function get_signing_key(
  secret_key: string,
  date_stamp: string,
): Buffer {
  const date_key = hmac(`AWS4${secret_key}`, date_stamp)
  const region_key = hmac(date_key, S3_REGION)
  const service_key = hmac(region_key, S3_SERVICE)
  return hmac(service_key, S3_SIGNING_SUFFIX)
}

function get_credential_scope(date_stamp: string): string {
  return `${date_stamp}/${S3_REGION}/${S3_SERVICE}/${S3_SIGNING_SUFFIX}`
}

type SignRequestOptions = {
  method: string
  path: string
  headers: Record<string, string>
  payload_hash: string
  access_key: string
  secret_key: string
  date: Date
}

function sign_request(
  options: SignRequestOptions,
): Record<string, string> {
  const date_stamp = get_date_stamp(options.date)
  const amz_date = get_amz_date(options.date)

  const signed_headers_list = Object.keys(options.headers)
    .map((header) => header.toLowerCase())
    .sort()

  const canonical_headers = signed_headers_list
    .map(
      (header) =>
        `${header}:${options.headers[header]?.trim() ?? ""}`,
    )
    .join("\n")

  const signed_headers = signed_headers_list.join(";")

  const canonical_request = [
    options.method,
    options.path,
    "",
    `${canonical_headers}\n`,
    signed_headers,
    options.payload_hash,
  ].join("\n")

  const credential_scope = get_credential_scope(date_stamp)

  const string_to_sign = [
    S3_ALGORITHM,
    amz_date,
    credential_scope,
    sha256(canonical_request),
  ].join("\n")

  const signing_key = get_signing_key(
    options.secret_key,
    date_stamp,
  )

  const signature = createHmac("sha256", signing_key)
    .update(string_to_sign)
    .digest("hex")

  const authorization = `${S3_ALGORITHM} Credential=${options.access_key}/${credential_scope}, SignedHeaders=${signed_headers}, Signature=${signature}`

  return {
    Authorization: authorization,
    "x-amz-date": amz_date,
    "x-amz-content-sha256": options.payload_hash,
  }
}

function build_signed_headers(
  method: string,
  path: string,
  content: Buffer | null,
  content_type?: string,
): Record<string, string> {
  const date = new Date()
  const endpoint = get_environment_variable(
    "OBJECT_STORE_ENDPOINT",
  )
  const host = endpoint.split(":")[0] ?? endpoint
  const port = endpoint.split(":")[1]
  const host_header = port ? `${host}:${port}` : host
  const payload_hash = content
    ? sha256(content)
    : EMPTY_HASH

  const headers: Record<string, string> = {
    host: host_header,
  }

  if (content_type) {
    headers["content-type"] = content_type
  }

  if (content) {
    headers["content-length"] = content.length.toString()
  }

  const signed = sign_request({
    method,
    path,
    headers,
    payload_hash,
    access_key: get_environment_variable(
      "OBJECT_STORE_ACCESS_KEY",
    ),
    secret_key: get_environment_variable(
      "OBJECT_STORE_SECRET_KEY",
    ),
    date,
  })

  return { ...headers, ...signed }
}

export async function put_object(
  key: string,
  content: Buffer,
  mime: string,
): Promise<[ObjectStoreError, null] | [null, null]> {
  const bucket = get_bucket()
  const path = `/${bucket}/${key}`
  const headers = build_signed_headers(
    "PUT",
    path,
    content,
    mime,
  )

  const [fetch_error, response] = await safe_async(
    fetch(`${get_base_url()}${path}`, {
      method: "PUT",
      headers,
      body: new Uint8Array(content),
    }),
  )
  if (fetch_error) {
    logger.error(fetch_error.message, { key }, fetch_error)
    return [
      {
        type: OBJECT_STORE_ERROR.PUT_FAILED,
        error: fetch_error,
      },
      null,
    ]
  }

  if (!response.ok) {
    const error_text = await response.text()
    const put_error = new Error(
      `Object store PUT failed: ${response.status} - ${error_text}`,
    )
    logger.error(put_error.message, { key }, put_error)
    return [
      {
        type: OBJECT_STORE_ERROR.PUT_FAILED,
        error: put_error,
      },
      null,
    ]
  }

  return [null, null]
}

export async function get_object(
  key: string,
): Promise<[ObjectStoreError, null] | [null, Buffer]> {
  const bucket = get_bucket()
  const path = `/${bucket}/${key}`
  const headers = build_signed_headers("GET", path, null)

  const [fetch_error, response] = await safe_async(
    fetch(`${get_base_url()}${path}`, {
      method: "GET",
      headers,
    }),
  )
  if (fetch_error) {
    logger.error(fetch_error.message, { key }, fetch_error)
    return [
      {
        type: OBJECT_STORE_ERROR.GET_FAILED,
        error: fetch_error,
      },
      null,
    ]
  }

  if (response.status === 404) {
    const not_found_error = new Error(
      `Object not found: ${key}`,
    )
    logger.error(
      not_found_error.message,
      { key },
      not_found_error,
    )
    return [
      {
        type: OBJECT_STORE_ERROR.NOT_FOUND,
        error: not_found_error,
      },
      null,
    ]
  }

  if (!response.ok) {
    const error_text = await response.text()
    const get_error = new Error(
      `Object store GET failed: ${response.status} - ${error_text}`,
    )
    logger.error(get_error.message, { key }, get_error)
    return [
      {
        type: OBJECT_STORE_ERROR.GET_FAILED,
        error: get_error,
      },
      null,
    ]
  }

  const [buffer_error, array_buffer] = await safe_async(
    response.arrayBuffer(),
  )
  if (buffer_error) {
    logger.error(
      buffer_error.message,
      { key },
      buffer_error,
    )
    return [
      {
        type: OBJECT_STORE_ERROR.GET_FAILED,
        error: buffer_error,
      },
      null,
    ]
  }

  return [null, Buffer.from(array_buffer)]
}

export async function delete_object(
  key: string,
): Promise<[ObjectStoreError, null] | [null, null]> {
  const bucket = get_bucket()
  const path = `/${bucket}/${key}`
  const headers = build_signed_headers("DELETE", path, null)

  const [fetch_error, response] = await safe_async(
    fetch(`${get_base_url()}${path}`, {
      method: "DELETE",
      headers,
    }),
  )
  if (fetch_error) {
    logger.error(fetch_error.message, { key }, fetch_error)
    return [
      {
        type: OBJECT_STORE_ERROR.DELETE_FAILED,
        error: fetch_error,
      },
      null,
    ]
  }

  if (!response.ok && response.status !== 404) {
    const error_text = await response.text()
    const delete_error = new Error(
      `Object store DELETE failed: ${response.status} - ${error_text}`,
    )
    logger.error(
      delete_error.message,
      { key },
      delete_error,
    )
    return [
      {
        type: OBJECT_STORE_ERROR.DELETE_FAILED,
        error: delete_error,
      },
      null,
    ]
  }

  return [null, null]
}

export async function object_exists(
  key: string,
): Promise<[ObjectStoreError, null] | [null, boolean]> {
  const bucket = get_bucket()
  const path = `/${bucket}/${key}`
  const headers = build_signed_headers("HEAD", path, null)

  const [fetch_error, response] = await safe_async(
    fetch(`${get_base_url()}${path}`, {
      method: "HEAD",
      headers,
    }),
  )
  if (fetch_error) {
    logger.error(fetch_error.message, { key }, fetch_error)
    return [
      {
        type: OBJECT_STORE_ERROR.GET_FAILED,
        error: fetch_error,
      },
      null,
    ]
  }

  return [null, response.ok]
}
