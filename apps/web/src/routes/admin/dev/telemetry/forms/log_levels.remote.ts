import { trace } from "@opentelemetry/api"
import * as v from "valibot"

import { form } from "$app/server"
import { logger } from "$lib/telemetry/logger"

export const log_levels = form(
  v.object({ level: v.picklist(["info", "warn", "error"]) }),
  async ({ level }) => {
    const trace_id =
      trace.getActiveSpan()?.spanContext().traceId ?? ""
    const message = `eng-198 poc: ${level} log without thrown error`
    if (level === "info") logger.info(message, { level })
    if (level === "warn") logger.warn(message, { level })
    if (level === "error") logger.error(message, { level })
    return { trace_id }
  },
)
