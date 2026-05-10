import { trace } from "@opentelemetry/api"
import * as v from "valibot"

import { form } from "$app/server"
import { logger } from "$lib/telemetry/logger"

const POC_TRACER = "eng-198-poc"

export const nested_spans = form(v.object({}), async () => {
  const tracer = trace.getTracer(POC_TRACER)

  return await tracer.startActiveSpan(
    "dev.telemetry.outer",
    async (outer) => {
      logger.info("entering outer span", { layer: "outer" })

      const result = await tracer.startActiveSpan(
        "dev.telemetry.inner",
        async (inner) => {
          logger.info("entering inner span", { layer: "inner" })
          await Promise.resolve()
          logger.warn("doing risky inner work", { layer: "inner" })
          const trace_id = inner.spanContext().traceId
          inner.end()
          return { trace_id }
        },
      )

      logger.info("leaving outer span", { layer: "outer" })
      outer.end()
      return result
    },
  )
})
