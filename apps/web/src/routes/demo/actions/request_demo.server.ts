import { safe_async } from "$lib/safe_async"
import type { ObjectValues } from "$lib/compose_types"
import { logger } from "$lib/telemetry/logger"

export const REQUEST_DEMO_ERROR = {
  FETCH_FAILED: 0,
  SERVICE_ERROR: 1,
} as const

// NOTE: newly added error
export type RequestDemoError = {
  type: ObjectValues<typeof REQUEST_DEMO_ERROR>
  error: Error
}

export async function request_demo(
  email: string,
): Promise<[RequestDemoError, null] | [null, null]> {
  const subject = "Nueva solicitud de demo"
  const text = `
<div>
  <p>El usuario <strong>${email}</strong> solicitó una demo para cuenta de tipo Inmobiliaria</p>
</div>`
  // NOTE: new safe implementation
  const [fetch_error, response] = await safe_async(
    fetch("http://go:8081/send-landlord-invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "nicolas.accetta@gmail.com",
        subject,
        text,
      }),
    }),
  )
  if (fetch_error) {
    logger.error(
      fetch_error.message,
      { email },
      fetch_error,
    )
    return [
      {
        type: REQUEST_DEMO_ERROR.FETCH_FAILED,
        error: fetch_error,
      },
      null,
    ]
  }

  if (!response.ok) {
    const error_text = await response.text()
    const request_error = new Error(
      `Failed to send demo request: ${response.status} - ${error_text}`,
    )
    logger.error(
      request_error.message,
      { email },
      request_error,
    )
    return [
      {
        type: REQUEST_DEMO_ERROR.SERVICE_ERROR,
        error: request_error,
      },
      null,
    ]
  }

  return [null, null]
}
