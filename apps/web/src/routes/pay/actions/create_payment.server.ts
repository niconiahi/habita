import { query_builder } from "db/query_builder"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import { now } from "$lib/server/now"
import {
  create_preference,
  CREATE_PREFERENCE_ERROR,
} from "$lib/server/mercado_pago_payment"

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
      return [
        {
          create_payment: {
            execution:
              "No se pudo conectar al servicio de pagos",
          },
        },
        null,
      ] as const
    }
    if (
      preference_error.type ===
      CREATE_PREFERENCE_ERROR.API_ERROR
    ) {
      return [
        {
          create_payment: {
            execution: "Error en el servicio de pagos",
          },
        },
        null,
      ] as const
    }
    if (
      preference_error.type ===
      CREATE_PREFERENCE_ERROR.JSON_PARSE_FAILED
    ) {
      return [
        {
          create_payment: {
            execution:
              "Respuesta inválida del servicio de pagos",
          },
        },
        null,
      ] as const
    }
    if (
      preference_error.type ===
      CREATE_PREFERENCE_ERROR.SCHEMA_VALIDATION_FAILED
    ) {
      return [
        {
          create_payment: {
            execution:
              "Respuesta inesperada del servicio de pagos",
          },
        },
        null,
      ] as const
    }
    return [
      {
        create_payment: {
          execution: "Error al crear el pago",
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
    }),
  )
  if (transaction_error) {
    logger.error(
      transaction_error.message,
      { preference_id: preference.id },
      transaction_error,
    )
    return [
      {
        create_payment: {
          execution: "Error al crear el pago",
        },
      },
      null,
    ] as const
  }

  logger.info("payment preference created", {
    preference_id: preference.id,
  })

  return [
    null,
    { init_point: preference.init_point },
  ] as const
}
