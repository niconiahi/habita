import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const PAYMENT_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
  CANCELLED: 3,
  REFUNDED: 4,
  CHARGED_BACK: 5,
} as const
export const PaymentStatusSchema = v.picklist(
  Object.values(PAYMENT_STATUS),
)
export type PaymentStatus = ObjectValues<
  typeof PAYMENT_STATUS
>

export function get_payment_status_label(
  type: number | PaymentStatus,
) {
  const payment_status = v.parse(PaymentStatusSchema, type)
  switch (payment_status) {
    case PAYMENT_STATUS.PENDING: {
      return "Pago en proceso"
    }
    case PAYMENT_STATUS.APPROVED: {
      return "Pago exitoso"
    }
    case PAYMENT_STATUS.REJECTED: {
      return "Pago rechazado"
    }
    case PAYMENT_STATUS.CANCELLED: {
      return "Pago cancelado"
    }
    case PAYMENT_STATUS.REFUNDED: {
      return "Pago reembolsado"
    }
    case PAYMENT_STATUS.CHARGED_BACK: {
      return "Pago con contracargo"
    }
    default: {
      const _exhaustive: never = payment_status
      return _exhaustive
    }
  }
}

export function get_payment_status_style(
  type: number | PaymentStatus,
) {
  const payment_status = v.parse(PaymentStatusSchema, type)
  switch (payment_status) {
    case PAYMENT_STATUS.APPROVED: {
      return "text-green-600"
    }
    case PAYMENT_STATUS.PENDING: {
      return "text-yellow-600"
    }
    case PAYMENT_STATUS.REJECTED:
    case PAYMENT_STATUS.CANCELLED:
    case PAYMENT_STATUS.REFUNDED:
    case PAYMENT_STATUS.CHARGED_BACK: {
      return "text-red-600"
    }
    default: {
      const _exhaustive: never = payment_status
      return _exhaustive
    }
  }
}

export function get_payment_statuses() {
  return Object.values(PAYMENT_STATUS)
}
