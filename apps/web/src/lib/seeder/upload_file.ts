import { createHash, createHmac } from "node:crypto"
import { readFile } from "node:fs/promises"
import * as v from "valibot"
import { query_builder } from "../../../db/query_builder"

function get_mime_type(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase()
  const mime_map: Record<string, string> = {
    pdf: "application/pdf",
    webp: "image/webp",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
  }
  return mime_map[ext || ""] || "application/octet-stream"
}

function sha256(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex")
}

function hmac(
  key: Buffer | string,
  data: string,
): Buffer {
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

async function upload_to_minio(
  key: string,
  content: Buffer,
  mime: string,
): Promise<void> {
  const endpoint = process.env.MINIO_ENDPOINT
  const access_key = process.env.MINIO_ACCESS_KEY
  const secret_key = process.env.MINIO_SECRET_KEY
  const bucket = process.env.MINIO_BUCKET
  if (!endpoint || !access_key || !secret_key || !bucket) {
    throw new Error(
      "MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, and MINIO_BUCKET must be set",
    )
  }

  const date = new Date()
  const date_stamp = get_date_stamp(date)
  const amz_date = get_amz_date(date)
  const path = `/${bucket}/${key}`
  const payload_hash = sha256(content)
  const host = endpoint

  const canonical_headers = `content-type:${mime}\nhost:${host}\nx-amz-content-sha256:${payload_hash}\nx-amz-date:${amz_date}\n`
  const signed_headers =
    "content-type;host;x-amz-content-sha256;x-amz-date"

  const canonical_request = `PUT\n${path}\n\n${canonical_headers}\n${signed_headers}\n${payload_hash}`

  const scope = `${date_stamp}/us-east-1/s3/aws4_request`
  const string_to_sign = `AWS4-HMAC-SHA256\n${amz_date}\n${scope}\n${sha256(Buffer.from(canonical_request))}`

  const date_key = hmac(`AWS4${secret_key}`, date_stamp)
  const region_key = hmac(date_key, "us-east-1")
  const service_key = hmac(region_key, "s3")
  const signing_key = hmac(service_key, "aws4_request")
  const signature = createHmac("sha256", signing_key)
    .update(string_to_sign)
    .digest("hex")

  const authorization = `AWS4-HMAC-SHA256 Credential=${access_key}/${scope}, SignedHeaders=${signed_headers}, Signature=${signature}`

  const response = await fetch(`http://${endpoint}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": mime,
      Host: host,
      "x-amz-content-sha256": payload_hash,
      "x-amz-date": amz_date,
      Authorization: authorization,
    },
    body: content,
  })
  if (!response.ok) {
    const error_text = await response.text()
    throw new Error(
      `MinIO PUT failed: ${response.status} - ${error_text}`,
    )
  }
}

export async function upload_file(
  path: string,
): Promise<number> {
  const now = new Date().toISOString()
  const content = await readFile(path)
  const hash = createHash("sha256")
    .update(content)
    .digest("hex")
  const basename = v.parse(
    v.string("basename is required"),
    path.split("/").pop(),
  )
  const mime = get_mime_type(path)
  const existing = await query_builder
    .selectFrom("file")
    .select("id")
    .where("hash", "=", hash)
    .executeTakeFirst()
  if (existing) {
    console.log(
      `file with hash ${hash} already exists, reusing`,
    )
    return existing.id
  }

  await upload_to_minio(`files/${hash}`, content, mime)

  const file = await query_builder
    .insertInto("file")
    .values({
      mime,
      basename,
      size: content.length,
      hash,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created file with id ${file.id}`)
  return file.id
}
