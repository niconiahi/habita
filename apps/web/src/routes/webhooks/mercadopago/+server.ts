import crypto from "node:crypto"
import { json } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { PAYMENT_STATUS } from "$lib/payment_status"
import { publish_extend_subscription } from "$lib/server/broker/producer/publish_extend_subscription"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"
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

  let response: Response
  try {
    response = await fetch(
      `https://api.mercadopago.com/v1/payments/${payment_id}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    )
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { payment_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return
  }

  if (!response.ok) {
    logger.error(
      `Failed to fetch payment ${payment_id}: ${response.status}`,
      { payment_id },
    )
    return
  }

  let data: unknown
  try {
    data = await response.json()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { payment_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return
  }

  const payment_validation = v.safeParse(
    MercadoPagoPaymentSchema,
    data,
  )
  if (!payment_validation.success) {
    logger.error("Schema validation failed", {
      payment_id,
    })
    return
  }
  const payment = payment_validation.output

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

  logger.info(
    `Payment ${payment_id} processed: ${payment.status} -> status ${status}`,
    { payment_id },
  )

  if (status === PAYMENT_STATUS.APPROVED) {
    const payment_record = await query_builder
      .selectFrom("payment_mercado_pago")
      .where("preference_id", "=", payment.preference_id)
      .select("payment_id")
      .executeTakeFirst()

    if (payment_record) {
      const subscription_payment = await query_builder
        .selectFrom("subscription_payment")
        .where("payment_id", "=", payment_record.payment_id)
        .select("id")
        .executeTakeFirst()

      if (subscription_payment) {
        await publish_extend_subscription(
          subscription_payment.id,
        )

        logger.info(
          "published extend_subscription event for payment",
          {
            payment_id,
            subscription_payment_id:
              subscription_payment.id,
          },
        )
      }
    }
  }
}

export const POST: RequestHandler = async ({ request }) => {
  const signature = request.headers.get("x-signature")
  const request_id = request.headers.get("x-request-id")

  if (!verify_webhook_signature(signature, request_id)) {
    logger.error("Invalid MercadoPago webhook signature")
    return json(
      { error: "Invalid signature" },
      { status: 401 },
    )
  }

  let data: unknown
  try {
    data = await request.json()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { request_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return json(
      { error: "Invalid request body" },
      { status: 400 },
    )
  }

  const webhook_validation = v.safeParse(
    MercadoPagoWebhookSchema,
    data,
  )
  if (!webhook_validation.success) {
    logger.error("Invalid webhook payload")
    return json(
      { error: "Invalid webhook payload" },
      { status: 400 },
    )
  }
  const webhook = webhook_validation.output

  if (webhook.type === "payment") {
    await handle_payment_notification(webhook.data.id)
  }

  return json({ received: true })
}
