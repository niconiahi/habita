import type { ObjectValues } from "$lib/compose_types"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

export const SEND_EMAIL_ERROR = {
  FETCH_FAILED: 0,
  SERVICE_ERROR: 1,
} as const

export type SendEmailError = ObjectValues<
  typeof SEND_EMAIL_ERROR
>

// NOTE: newly added error
type SendEmailTypedError = {
  type: SendEmailError
  error: Error
}

export async function send_email(
  body: object,
  headers?: Record<string, string>,
): Promise<[SendEmailTypedError, null] | [null, null]> {
  const merged_headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  }

  const [fetch_error, response] = await safe_async(
    fetch("http://go:8081/send-email", {
      method: "POST",
      headers: merged_headers,
      body: JSON.stringify(body),
    }),
  )
  if (fetch_error) {
    logger.error(fetch_error.message, {}, fetch_error)
    return [
      {
        type: SEND_EMAIL_ERROR.FETCH_FAILED,
        error: fetch_error,
      },
      null,
    ]
  }

  if (!response.ok) {
    const error_text = await response.text()
    const service_error = new Error(
      `Email service error: ${response.status} - ${error_text}`,
    )
    logger.error(service_error.message, {}, service_error)
    return [
      {
        type: SEND_EMAIL_ERROR.SERVICE_ERROR,
        error: service_error,
      },
      null,
    ]
  }

  return [null, null]
}
