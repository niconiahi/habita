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
  external_reference: v.nullish(v.string()),
  order: v.object({
    id: v.union([v.string(), v.number()]),
  }),
})

const MercadoPagoMerchantOrderSchema = v.object({
  preference_id: v.string(),
})

const PAYMENT_METHOD_MERCADO_PAGO = 1

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
  data_id: string,
) {
  if (!signature || !request_id) return false

  const webhook_secret = get_webhook_secret()

  const parts = signature.split(",")
  const ts_match = parts.find((p) => p.startsWith("ts="))
  const v1_match = parts.find((p) => p.startsWith("v1="))

  if (!ts_match || !v1_match) return false

  const timestamp = ts_match.replace("ts=", "")
  const provided_hash = v1_match.replace("v1=", "")

  // MP manifest format: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
  const signed_payload = `id:${data_id};request-id:${request_id};ts:${timestamp};`

  const expected_hash = crypto
    .createHmac("sha256", webhook_secret)
    .update(signed_payload)
    .digest("hex")

  console.log("[webhook] signature manifest", {
    signed_payload,
    provided_hash,
    expected_hash,
  })

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
  console.log(
    "[webhook] handle_payment_notification entered",
    { payment_id },
  )
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
      logger.error(error.message, { payment_id }, error)
    } else {
      logger.unknown(error)
    }
    return
  }

  console.log("[webhook] MP payments API response", {
    payment_id,
    status: response.status,
    ok: response.ok,
  })
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
      logger.error(error.message, { payment_id }, error)
    } else {
      logger.unknown(error)
    }
    return
  }

  console.log("[webhook] MP payment body", data)
  const payment_validation = v.safeParse(
    MercadoPagoPaymentSchema,
    data,
  )
  if (!payment_validation.success) {
    console.log(
      "[webhook] schema validation FAILED",
      v.flatten(payment_validation.issues),
    )
    logger.error("Schema validation failed", {
      payment_id,
    })
    return
  }
  const payment = payment_validation.output
  const status = MERCADOPAGO_STATUS_MAP[payment.status]
  console.log("[webhook] parsed payment", {
    mp_status: payment.status,
    mapped_status: status,
    external_reference: payment.external_reference,
  })

  if (status !== PAYMENT_STATUS.APPROVED) {
    console.log("[webhook] not approved, skipping insert", {
      mp_status: payment.status,
    })
    logger.info(
      `Payment ${payment_id} skipped: status ${payment.status}`,
      { payment_id },
    )
    return
  }

  if (!payment.external_reference) {
    logger.error(
      `Approved payment ${payment_id} has no external_reference`,
      { payment_id },
    )
    return
  }
  const subscription_id = Number(payment.external_reference)
  if (!Number.isInteger(subscription_id)) {
    logger.error(
      `Approved payment ${payment_id} has invalid external_reference: ${payment.external_reference}`,
      { payment_id },
    )
    return
  }

  console.log(
    "[webhook] approved + valid external_reference",
    { subscription_id, order_id: payment.order.id },
  )
  const existing = await query_builder
    .selectFrom("payment_mercado_pago")
    .where("operation_id", "=", payment_id)
    .select("id")
    .executeTakeFirst()
  if (existing) {
    console.log(
      "[webhook] operation already recorded, skipping",
      { operation_id: payment_id },
    )
    logger.info(`Payment ${payment_id} already recorded`, {
      payment_id,
    })
    return
  }

  let order_response: Response
  try {
    order_response = await fetch(
      `https://api.mercadopago.com/merchant_orders/${payment.order.id}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    )
  } catch (error) {
    console.log(
      "[webhook] merchant_orders fetch threw",
      error,
    )
    if (error instanceof Error) {
      logger.error(error.message, { payment_id }, error)
    } else {
      logger.unknown(error)
    }
    return
  }

  console.log("[webhook] merchant_orders API response", {
    order_id: payment.order.id,
    status: order_response.status,
    ok: order_response.ok,
  })
  if (!order_response.ok) {
    logger.error(
      `Failed to fetch merchant_order ${payment.order.id}: ${order_response.status}`,
      { payment_id },
    )
    return
  }

  let order_data: unknown
  try {
    order_data = await order_response.json()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, { payment_id }, error)
    } else {
      logger.unknown(error)
    }
    return
  }

  const order_validation = v.safeParse(
    MercadoPagoMerchantOrderSchema,
    order_data,
  )
  if (!order_validation.success) {
    console.log(
      "[webhook] merchant_order schema validation FAILED",
      v.flatten(order_validation.issues),
    )
    return
  }
  const preference_id =
    order_validation.output.preference_id
  console.log(
    "[webhook] resolved preference_id from merchant_order",
    { preference_id },
  )

  let subscription_payment_id: number
  try {
    subscription_payment_id = await query_builder
      .transaction()
      .execute(async (tx) => {
        const inserted_payment = await tx
          .insertInto("payment")
          .values({
            payment_method_id: PAYMENT_METHOD_MERCADO_PAGO,
            created_at: now,
            updated_at: now,
          })
          .returning("id")
          .executeTakeFirstOrThrow()

        await tx
          .insertInto("payment_mercado_pago")
          .values({
            preference_id,
            operation_id: payment_id,
            status,
            payment_id: inserted_payment.id,
            created_at: now,
            updated_at: now,
          })
          .execute()

        const inserted_subscription_payment = await tx
          .insertInto("subscription_payment")
          .values({
            subscription_id,
            payment_id: inserted_payment.id,
            created_at: now,
          })
          .returning("id")
          .executeTakeFirstOrThrow()

        console.log("[webhook] inserted rows", {
          payment_id: inserted_payment.id,
          subscription_payment_id:
            inserted_subscription_payment.id,
        })
        return inserted_subscription_payment.id
      })
  } catch (error) {
    console.log("[webhook] insert transaction threw", error)
    if (error instanceof Error) {
      logger.error(error.message, { payment_id }, error)
    } else {
      logger.unknown(error)
    }
    return
  }

  logger.info(
    `Payment ${payment_id} recorded for subscription ${subscription_id}`,
    { payment_id },
  )

  await publish_extend_subscription(subscription_payment_id)
  logger.info(
    "published extend_subscription event for payment",
    {
      payment_id,
      subscription_payment_id,
    },
  )
}

export const POST: RequestHandler = async ({ request }) => {
  console.log("[webhook] POST received", {
    url: request.url,
    has_signature: !!request.headers.get("x-signature"),
    has_request_id: !!request.headers.get("x-request-id"),
    content_type: request.headers.get("content-type"),
    user_agent: request.headers.get("user-agent"),
  })
  const signature = request.headers.get("x-signature")
  const request_id = request.headers.get("x-request-id")

  let data: unknown
  try {
    data = await request.json()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, { request_id }, error)
    } else {
      logger.unknown(error)
    }
    return json(
      { error: "Invalid request body" },
      { status: 400 },
    )
  }

  console.log("[webhook] body parsed", data)
  const webhook_validation = v.safeParse(
    MercadoPagoWebhookSchema,
    data,
  )
  if (!webhook_validation.success) {
    console.log(
      "[webhook] envelope validation FAILED",
      v.flatten(webhook_validation.issues),
    )
    logger.error("Invalid webhook payload")
    return json(
      { error: "Invalid webhook payload" },
      { status: 400 },
    )
  }
  const webhook = webhook_validation.output
  console.log("[webhook] envelope parsed", {
    type: webhook.type,
    data_id: webhook.data.id,
  })

  const sig_ok = verify_webhook_signature(
    signature,
    request_id,
    webhook.data.id,
  )
  console.log("[webhook] signature outcome", {
    valid: sig_ok,
  })
  if (!sig_ok) {
    logger.error("Invalid MercadoPago webhook signature")
    return json(
      { error: "Invalid signature" },
      { status: 401 },
    )
  }

  if (webhook.type === "payment") {
    await handle_payment_notification(webhook.data.id)
  } else {
    console.log("[webhook] non-payment type, ignoring", {
      type: webhook.type,
    })
  }

  console.log("[webhook] returning 200")
  return json({ received: true })
}
