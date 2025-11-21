import { trace, SpanStatusCode } from "@opentelemetry/api"
import { SeverityNumber } from "@opentelemetry/api-logs"

type Entry = {
  timestamp: string
  severity: SeverityNumber
  message: string
  trace_id?: string
  span_id?: string
  [key: string]: unknown
}

function warn(
  message: string,
  fields?: Record<string, unknown>,
): void {
  const span = trace.getActiveSpan()
  const span_context = span?.spanContext()
  const entry: Entry = {
    timestamp: new Date().toISOString(),
    severity: SeverityNumber.WARN,
    message,
    ...fields,
  }
  if (span_context) {
    entry.trace_id = span_context.traceId
    entry.span_id = span_context.spanId
  }
  console.log(JSON.stringify(entry))
}

function info(
  message: string,
  fields?: Record<string, unknown>,
): void {
  const span = trace.getActiveSpan()
  const span_context = span?.spanContext()
  const entry: Entry = {
    timestamp: new Date().toISOString(),
    severity: SeverityNumber.INFO,
    message,
    ...fields,
  }
  if (span_context) {
    entry.trace_id = span_context.traceId
    entry.span_id = span_context.spanId
  }
  console.log(JSON.stringify(entry))
}

function error(
  message: string,
  fields?: Record<string, unknown>,
  error?: Error,
) {
  const span = trace.getActiveSpan()
  const span_context = span?.spanContext()
  const entry: Entry = {
    timestamp: new Date().toISOString(),
    severity: SeverityNumber.ERROR,
    message,
    ...fields,
  }
  if (span_context) {
    entry.trace_id = span_context.traceId
    entry.span_id = span_context.spanId
  }
  entry.error = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  }
  if (span) {
    span.recordException(error)
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    })
  }
  console.log(JSON.stringify(entry))
}

export const logger = {
  info,
  warn,
  error,
}
