import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const SIGNATURE_STATUS = {
  PENDING: "pending",
  SIGNED: "signed",
  ERROR: "error",
  REJECTED: "rejected",
} as const
export const SignatureStatusSchema = v.picklist(
  Object.values(SIGNATURE_STATUS),
)
export type SignatureStatus = ObjectValues<
  typeof SIGNATURE_STATUS
>

export function get_signature_status_label(
  status: string | SignatureStatus,
) {
  const signature_status = v.parse(
    SignatureStatusSchema,
    status,
  )
  switch (signature_status) {
    case SIGNATURE_STATUS.PENDING: {
      return "Pendiente"
    }
    case SIGNATURE_STATUS.SIGNED: {
      return "Firmado"
    }
    case SIGNATURE_STATUS.ERROR: {
      return "Error"
    }
    case SIGNATURE_STATUS.REJECTED: {
      return "Rechazado"
    }
    default: {
      const _exhaustive: never = signature_status
      return _exhaustive
    }
  }
}
