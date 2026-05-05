import { query_builder } from "db/query_builder"
import { fail, redirect } from "@sveltejs/kit"
import {
  CREATE_PREFERENCE_ERROR,
  create_preference,
} from "$lib/server/mercado_pago_payment"
import { now } from "$lib/server/now"
import { logger } from "$lib/telemetry/logger"

const PAYMENT_METHOD_MERCADO_PAGO = 1
const PAYMENT_STATUS_PENDING = 0

export async function create_payment() {
  const [preference_error, preference] =
    await create_preference({
      title: "Pago de prueba",
      amount: 50,
    })
  if (preference_error) {
    if (
      preference_error.type ===
      CREATE_PREFERENCE_ERROR.FETCH_FAILED
    ) {
      return fail(400, {
        message:
          "No se pudo conectar al servicio de pagos",
      })
    }
    if (
      preference_error.type ===
      CREATE_PREFERENCE_ERROR.API_ERROR
    ) {
      return fail(400, {
        message: "Error en el servicio de pagos",
      })
    }
    if (
      preference_error.type ===
      CREATE_PREFERENCE_ERROR.JSON_PARSE_FAILED
    ) {
      return fail(400, {
        message:
          "Respuesta inválida del servicio de pagos",
      })
    }
    if (
      preference_error.type ===
      CREATE_PREFERENCE_ERROR.SCHEMA_VALIDATION_FAILED
    ) {
      return fail(400, {
        message:
          "Respuesta inesperada del servicio de pagos",
      })
    }
    return fail(400, {
      message: "Error al crear el pago",
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
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { preference_id: preference.id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al crear el pago",
    })
  }

  logger.info("payment preference created", {
    preference_id: preference.id,
  })

  redirect(303, preference.init_point)
}
