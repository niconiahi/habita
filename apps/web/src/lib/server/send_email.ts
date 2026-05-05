import type { ObjectValues } from "$lib/compose_types"
import { logger } from "$lib/telemetry/logger"

export const SEND_EMAIL_ERROR = {
  FETCH_FAILED: 0,
  SERVICE_ERROR: 1,
} as const

export class SendEmailError extends Error {
  constructor(
    public type: ObjectValues<typeof SEND_EMAIL_ERROR>,
    cause: Error,
  ) {
    super(cause.message, { cause })
  }
}

type SendEmailBody = {
  to: { email: string; name: string }
  subject: string
  html: string
  ics?: string
}

export async function send_email(
  body: SendEmailBody,
  headers?: Record<string, string>,
): Promise<void> {
  const merged_headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  }

  let response: Response
  try {
    response = await fetch("http://go:8081/send-email", {
      method: "POST",
      headers: merged_headers,
      body: JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
      throw new SendEmailError(
        SEND_EMAIL_ERROR.FETCH_FAILED,
        error,
      )
    } else {
      logger.unknown(error)
      throw new SendEmailError(
        SEND_EMAIL_ERROR.FETCH_FAILED,
        new Error("unknown error"),
      )
    }
  }

  if (!response.ok) {
    const error_text = await response.text()
    const service_error = new Error(
      `Email service error: ${response.status} - ${error_text}`,
    )
    logger.error(service_error.message, {}, service_error)
    throw new SendEmailError(
      SEND_EMAIL_ERROR.SERVICE_ERROR,
      service_error,
    )
  }
}
