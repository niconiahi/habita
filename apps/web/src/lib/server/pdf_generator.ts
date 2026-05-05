import type { ObjectValues } from "$lib/compose_types"
import { logger } from "$lib/telemetry/logger"

export const GENERATE_PDF_WITH_PLAYWRIGHT_ERROR = {
  FETCH_FAILED: 0,
  SERVICE_ERROR: 1,
  BUFFER_READ_FAILED: 2,
} as const

export class GeneratePdfWithPlaywrightError extends Error {
  constructor(
    public type: ObjectValues<
      typeof GENERATE_PDF_WITH_PLAYWRIGHT_ERROR
    >,
    cause: Error,
  ) {
    super(cause.message, { cause })
  }
}

export async function generate_pdf_with_playwright(
  html: string,
): Promise<Buffer> {
  let response: Response
  try {
    response = await fetch("http://pdf:8082/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    })
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
      throw new GeneratePdfWithPlaywrightError(
        GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.FETCH_FAILED,
        error,
      )
    } else {
      logger.unknown(error)
      throw new GeneratePdfWithPlaywrightError(
        GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.FETCH_FAILED,
        new Error("unknown error"),
      )
    }
  }

  if (!response.ok) {
    const error_text = await response.text()
    const pdf_error = new Error(
      `PDF generation failed: ${error_text}`,
    )
    logger.error(pdf_error.message, {}, pdf_error)
    throw new GeneratePdfWithPlaywrightError(
      GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.SERVICE_ERROR,
      pdf_error,
    )
  }

  let array_buffer: ArrayBuffer
  try {
    array_buffer = await response.arrayBuffer()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
      throw new GeneratePdfWithPlaywrightError(
        GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.BUFFER_READ_FAILED,
        error,
      )
    } else {
      logger.unknown(error)
      throw new GeneratePdfWithPlaywrightError(
        GENERATE_PDF_WITH_PLAYWRIGHT_ERROR.BUFFER_READ_FAILED,
        new Error("unknown error"),
      )
    }
  }

  return Buffer.from(array_buffer)
}
