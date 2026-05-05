import { query_builder } from "db/query_builder"
import { fail, redirect } from "@sveltejs/kit"
import {
  CREATE_PREFERENCE_ERROR,
  CreatePreferenceError,
  create_preference,
} from "$lib/server/mercado_pago_payment"
import { now } from "$lib/server/now"
import { get_origin } from "$lib/server/origin"
import { SUBSCRIPTION_TYPE } from "$lib/subscription_type"
import { logger } from "$lib/telemetry/logger"

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
    return fail(400, {
      message:
        "No se encontró una suscripción activa",
    })
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

  let preference: { id: string; init_point: string }
  try {
    preference = await create_preference({
      title,
      amount,
      back_urls: {
        success: `${origin}/subscribe/success`,
        failure: `${origin}/subscribe`,
        pending: `${origin}/subscribe`,
      },
    })
  } catch (error) {
    if (error instanceof CreatePreferenceError) {
      if (
        error.type ===
        CREATE_PREFERENCE_ERROR.FETCH_FAILED
      ) {
        return fail(400, {
          message:
            "No se pudo conectar al servicio de pagos",
        })
      }
      return fail(400, {
        message: "Error en el servicio de pagos",
      })
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error en el servicio de pagos",
    })
  }

  try {
    await query_builder.transaction().execute(async (tx) => {
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
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        {
          organization_id,
          preference_id: preference.id,
        },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al crear el pago",
    })
  }

  logger.info("subscription payment preference created", {
    organization_id,
    preference_id: preference.id,
    amount,
    seat_count,
  })

  redirect(303, preference.init_point)
}
