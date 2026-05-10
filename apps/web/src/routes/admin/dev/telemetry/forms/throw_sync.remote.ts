import { trace } from "@opentelemetry/api"
import { error } from "@sveltejs/kit"
import * as v from "valibot"

import { form } from "$app/server"
import { logger } from "$lib/telemetry/logger"

export const throw_sync = form(v.object({}), async () => {
  const trace_id =
    trace.getActiveSpan()?.spanContext().traceId ?? ""
  try {
    do_the_bad_thing()
    return { trace_id }
  } catch (err) {
    logger.unknown(err)
    error(500, JSON.stringify({ trace_id }))
  }
})

function do_the_bad_thing(): never {
  throw new Error("eng-198 poc: synchronous throw")
}
