import { query_builder } from "db/query_builder"
import { fail, redirect } from "@sveltejs/kit"
import {
  CREATE_PREFERENCE_ERROR,
  CreatePreferenceError,
  create_preference,
} from "$lib/server/mercado_pago_payment"
import { get_origin } from "$lib/server/origin"
import { SUBSCRIPTION_TYPE } from "$lib/subscription_type"
import { logger } from "$lib/telemetry/logger"

const FREELANCE_PRICE_USD = 50
const REALTOR_SEAT_PRICE_USD = 40

export async function create_subscription_payment(
  organization_id: string,
) {
  console.log("[mp/helper] entered with organization_id", organization_id)
  const subscriptions = await query_builder
    .selectFrom("subscription")
    .where("organization_id", "=", organization_id)
    .selectAll()
    .execute()

  console.log("[mp/helper] fetched subs for org", { count: subscriptions.length, ids: subscriptions.map(s => s.id) })
  if (subscriptions.length === 0) {
    console.log("[mp/helper] no subs for org, failing")
    return fail(400, {
      message: "No se encontró una suscripción activa",
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

  console.log("[mp/helper] about to create preference", { external_reference: String(first_subscription.id), amount, title })

  let preference: { id: string; init_point: string }
  try {
    preference = await create_preference({
      title,
      amount,
      external_reference: String(first_subscription.id),
      back_urls: {
        success: `${origin}/subscribe/success`,
        failure: `${origin}/subscribe`,
        pending: `${origin}/subscribe`,
      },
    })
    console.log("[mp/helper] preference created", { id: preference.id, init_point: preference.init_point })
  } catch (error) {
    console.log("[mp/helper] create_preference threw", error)
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

  logger.info("subscription payment preference created", {
    organization_id,
    subscription_id: first_subscription.id,
    preference_id: preference.id,
    amount,
    seat_count,
  })

  redirect(303, preference.init_point)
}
