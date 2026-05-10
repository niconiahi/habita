import { trace } from "@opentelemetry/api"
import * as v from "valibot"

import { form } from "$app/server"
import { logger } from "$lib/telemetry/logger"

export const log_unknown = form(v.object({}), async () => {
  const trace_id =
    trace.getActiveSpan()?.spanContext().traceId ?? ""
  try {
    throw "eng-198 poc: a plain string thrown like a savage"
  } catch (err) {
    logger.unknown(err)
  }
  return { trace_id }
})
