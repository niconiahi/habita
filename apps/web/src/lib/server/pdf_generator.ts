import { safe_async } from "$lib/safe_async"
import type { ObjectValues } from "$lib/compose_types"
import { logger } from "$lib/telemetry/logger"

export const GENERATE_PDF_WITH_PLAYWRIGHT_ERROR = {
  FETCH_FAILED: 0,
  SERVICE_ERROR: 1,
  BUFFER_READ_FAILED: 2,
} as const

// NOTE: newly added error
export type GeneratePdfWithPlaywrightError = {
  type: ObjectValues<
    typeof GENERATE_PDF_WITH_PLAYWRIGHT_ERROR
  >
  error: Error
}

export async function generate_pdf_with_playwright(
  html: string,
): Promise<
  [GeneratePdfWithPlaywrightError, null] | [null, Buffer]
> {
  const [fetch_error, response] = await safe_async(
    fetch("http://pdf:8082/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    }),
  )
  if (fetch_error) {
    logger.error(fetch_error.message, {}, fetch_error)
    return [
      {
        type: GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.FETCH_FAILED,
        error: fetch_error,
      },
      null,
    ]
  }

  if (!response.ok) {
    const error_text = await response.text()
    const pdf_error = new Error(
      `PDF generation failed: ${error_text}`,
    )
    logger.error(pdf_error.message, {}, pdf_error)
    return [
      {
        type: GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.SERVICE_ERROR,
        error: pdf_error,
      },
      null,
    ]
  }

  const [buffer_error, array_buffer] = await safe_async(
    response.arrayBuffer(),
  )
  if (buffer_error) {
    logger.error(buffer_error.message, {}, buffer_error)
    return [
      {
        type: GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.BUFFER_READ_FAILED,
        error: buffer_error,
      },
      null,
    ]
  }

  return [null, Buffer.from(array_buffer)]
}
