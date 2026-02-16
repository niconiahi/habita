import { json } from "@sveltejs/kit"
import crypto from "node:crypto"
import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { now } from "$lib/server/now"
import { PAYMENT_STATUS } from "$lib/payment_status"
import type { RequestHandler } from "./$types"

const MERCADOPAGO_STATUS_MAP = {
  pending: PAYMENT_STATUS.PENDING,
  approved: PAYMENT_STATUS.APPROVED,
  rejected: PAYMENT_STATUS.REJECTED,
  cancelled: PAYMENT_STATUS.CANCELLED,
  refunded: PAYMENT_STATUS.REFUNDED,
  charged_back: PAYMENT_STATUS.CHARGED_BACK,
}

const MercadoPagoWebhookSchema = v.object({
  type: v.string(),
  data: v.object({
    id: v.string(),
  }),
})

const MercadoPagoPaymentSchema = v.object({
  status: v.picklist([
    "pending",
    "approved",
    "rejected",
    "cancelled",
    "refunded",
    "charged_back",
  ]),
  preference_id: v.string(),
})

function get_webhook_secret() {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
  if (!secret) {
    throw new Error(
      "MERCADO_PAGO_WEBHOOK_SECRET is not set",
    )
  }
  return secret
}

function get_access_token() {
  const is_development =
    process.env.NODE_ENV === "development"
  const token = is_development
    ? process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN
    : process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (!token) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not set")
  }
  return token
}

function verify_webhook_signature(
  signature: string | null,
  request_id: string | null,
) {
  if (!signature || !request_id) return false

  const webhook_secret = get_webhook_secret()

  const parts = signature.split(",")
  const ts_match = parts.find((p) => p.startsWith("ts="))
  const v1_match = parts.find((p) => p.startsWith("v1="))

  if (!ts_match || !v1_match) return false

  const timestamp = ts_match.replace("ts=", "")
  const provided_hash = v1_match.replace("v1=", "")

  const signed_payload = `id:${request_id};ts:${timestamp};`

  const expected_hash = crypto
    .createHmac("sha256", webhook_secret)
    .update(signed_payload)
    .digest("hex")

  try {
    return crypto.timingSafeEqual(
      Buffer.from(provided_hash),
      Buffer.from(expected_hash),
    )
  } catch {
    return false
  }
}

async function handle_payment_notification(
  payment_id: string,
) {
  const access_token = get_access_token()
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${payment_id}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    },
  )
  if (!response.ok) {
    console.error(
      `Failed to fetch payment ${payment_id}: ${response.status}`,
    )
    return
  }

  const data = await response.json()
  const payment = v.parse(MercadoPagoPaymentSchema, data)
  const status = MERCADOPAGO_STATUS_MAP[payment.status]

  await query_builder
    .updateTable("payment_mercado_pago")
    .set({
      status,
      operation_id: payment_id,
      updated_at: now,
    })
    .where("preference_id", "=", payment.preference_id)
    .execute()

  console.log(
    `Payment ${payment_id} processed: ${payment.status} -> status ${status}`,
  )
}

export const POST: RequestHandler = async ({ request }) => {
  const signature = request.headers.get("x-signature")
  const request_id = request.headers.get("x-request-id")

  if (!verify_webhook_signature(signature, request_id)) {
    console.error("Invalid MercadoPago webhook signature")
    return json(
      { error: "Invalid signature" },
      { status: 401 },
    )
  }

  const data = await request.json()
  const webhook = v.parse(MercadoPagoWebhookSchema, data)

  if (webhook.type === "payment") {
    await handle_payment_notification(webhook.data.id)
  }

  return json({ received: true })
}
