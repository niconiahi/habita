import { query_builder } from "db/query_builder"
import { PAYMENT_STATUS } from "$lib/payment_status"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ url }) => {
  const preference_id =
    url.searchParams.get("preference_id")

  if (!preference_id) {
    return {
      status: null,
      message: "No se encontró información del pago",
    }
  }

  const payment = await query_builder
    .selectFrom("payment_mercado_pago")
    .select(["status", "operation_id"])
    .where("preference_id", "=", preference_id)
    .executeTakeFirst()

  if (!payment) {
    return {
      status: null,
      message: "Pago no encontrado",
    }
  }

  if (payment.status === PAYMENT_STATUS.APPROVED) {
    return {
      status: PAYMENT_STATUS.APPROVED,
      message: "Tu pago ha sido confirmado",
      operation_id: payment.operation_id,
    }
  }

  if (payment.status === PAYMENT_STATUS.PENDING) {
    return {
      status: PAYMENT_STATUS.PENDING,
      message:
        "Tu pago está siendo procesado. Te notificaremos cuando se confirme.",
      operation_id: payment.operation_id,
    }
  }

  return {
    status: payment.status,
    message:
      "El pago fue rechazado. Por favor, intenta nuevamente.",
    operation_id: payment.operation_id,
  }
}
