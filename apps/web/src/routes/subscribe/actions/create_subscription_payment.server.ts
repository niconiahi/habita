import { sql } from "kysely"
import { query_builder } from "db/query_builder"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import { now } from "$lib/server/now"
import { get_origin } from "$lib/server/origin"
import {
  create_preference,
  CREATE_PREFERENCE_ERROR,
} from "$lib/server/mercado_pago_payment"
import { SUBSCRIPTION_TYPE } from "$lib/subscription_type"

const PAYMENT_METHOD_MERCADO_PAGO = 1
const PAYMENT_STATUS_PENDING = 0
const FREELANCE_PRICE_USD = 50
const REALTOR_SEAT_PRICE_USD = 40

export async function create_subscription_payment(
  organization_id: string,
) {
  const subscriptions = await query_builder
    .selectFrom("subscription")
    .where("organization_id", "=", organization_id)
    .selectAll()
    .execute()

  if (subscriptions.length === 0) {
    return [
      {
        create_subscription_payment: {
          execution: "No se encontró una suscripción activa",
        },
      },
      null,
    ] as const
  }

  const first_subscription = subscriptions[0]
  const seat_count = subscriptions.length
  const amount =
    first_subscription.type === SUBSCRIPTION_TYPE.FREELANCE
      ? FREELANCE_PRICE_USD
      : seat_count * REALTOR_SEAT_PRICE_USD

  const title =
    first_subscription.type === SUBSCRIPTION_TYPE.FREELANCE
      ? "Suscripción Habita - Freelance"
      : `Suscripción Habita - Inmobiliaria (${seat_count} ${seat_count === 1 ? "puesto" : "puestos"})`

  const origin = get_origin()
  const [preference_error, preference] =
    await create_preference({
      title,
      amount,
      back_urls: {
        success: `${origin}/subscribe/success`,
        failure: `${origin}/subscribe`,
        pending: `${origin}/subscribe`,
      },
    })
  if (preference_error) {
    if (
      preference_error.type ===
      CREATE_PREFERENCE_ERROR.FETCH_FAILED
    ) {
      return [
        {
          create_subscription_payment: {
            execution:
              "No se pudo conectar al servicio de pagos",
          },
        },
        null,
      ] as const
    }
    return [
      {
        create_subscription_payment: {
          execution: "Error en el servicio de pagos",
        },
      },
      null,
    ] as const
  }

  const [transaction_error] = await safe_async(
    query_builder.transaction().execute(async (tx) => {
      const payment = await tx
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
          preference_id: preference.id,
          status: PAYMENT_STATUS_PENDING,
          payment_id: payment.id,
          created_at: now,
          updated_at: now,
        })
        .execute()

      await tx
        .insertInto("subscription_payment")
        .values({
          subscription_id: first_subscription.id,
          payment_id: payment.id,
          created_at: now,
        })
        .execute()
    }),
  )
  if (transaction_error) {
    logger.error(
      "failed to create subscription payment",
      {
        organization_id,
        preference_id: preference.id,
      },
      transaction_error,
    )
    return [
      {
        create_subscription_payment: {
          execution: "Error al crear el pago",
        },
      },
      null,
    ] as const
  }

  logger.info("subscription payment preference created", {
    organization_id,
    preference_id: preference.id,
    amount,
    seat_count,
  })

  return [
    null,
    { init_point: preference.init_point },
  ] as const
}
