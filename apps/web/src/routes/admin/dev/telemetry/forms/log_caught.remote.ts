import { trace } from "@opentelemetry/api"
import * as v from "valibot"

import { form } from "$app/server"
import { logger } from "$lib/telemetry/logger"

export const log_caught = form(v.object({}), async () => {
  const trace_id =
    trace.getActiveSpan()?.spanContext().traceId ?? ""
  try {
    risky_call()
  } catch (err) {
    if (err instanceof Error) {
      logger.error(
        "operacion riesgosa fallo",
        { user_facing: true, retried: 0 },
        err,
      )
    }
  }
  return { trace_id }
})

function risky_call(): never {
  throw new Error("eng-198 poc: caught + logged with user attrs")
}
