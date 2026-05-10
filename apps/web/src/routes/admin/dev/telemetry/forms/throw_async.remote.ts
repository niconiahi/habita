import { trace } from "@opentelemetry/api"
import { error } from "@sveltejs/kit"
import * as v from "valibot"

import { form } from "$app/server"
import { logger } from "$lib/telemetry/logger"

export const throw_async = form(v.object({}), async () => {
  const trace_id =
    trace.getActiveSpan()?.spanContext().traceId ?? ""
  try {
    await deeply_nested_async()
    return { trace_id }
  } catch (err) {
    if (err instanceof Error)
      logger.error(err.message, { source: "async-poc" }, err)
    else logger.unknown(err)
    error(500, JSON.stringify({ trace_id }))
  }
})

async function deeply_nested_async(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  throw new Error("eng-198 poc: rejected promise inside async chain")
}
