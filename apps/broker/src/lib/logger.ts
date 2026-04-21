import { SpanStatusCode, trace } from "@opentelemetry/api"
import {
  type LogAttributes,
  logs,
  SeverityNumber,
} from "@opentelemetry/api-logs"

function get_otel_logger() {
  return logs.getLoggerProvider().getLogger("web")
}

function warn(
  message: string,
  attributes?: LogAttributes,
): void {
  const span = trace.getActiveSpan()
  const span_context = span?.spanContext()
  const _attributes: LogAttributes = {
    ...attributes,
  }
  if (span_context) {
    _attributes.trace_id = span_context.traceId
    _attributes.span_id = span_context.spanId
  }
  get_otel_logger().emit({
    severityNumber: SeverityNumber.WARN,
    body: message,
    attributes: _attributes,
  })
}

function info(
  message: string,
  attributes?: LogAttributes,
): void {
  const span = trace.getActiveSpan()
  const span_context = span?.spanContext()
  const _attributes: LogAttributes = {
    ...attributes,
  }
  if (span_context) {
    _attributes.trace_id = span_context.traceId
    _attributes.span_id = span_context.spanId
  }
  get_otel_logger().emit({
    severityNumber: SeverityNumber.INFO,
    body: message,
    attributes: _attributes,
  })
}

function error(
  message: string,
  attributes?: LogAttributes,
  error?: Error,
) {
  const span = trace.getActiveSpan()
  const span_context = span?.spanContext()
  const _attributes: LogAttributes = {
    ...attributes,
  }
  if (span_context) {
    _attributes.trace_id = span_context.traceId
    _attributes.span_id = span_context.spanId
  }
  if (error) {
    _attributes.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  if (span && error) {
    span.recordException(error)
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    })
  }
  get_otel_logger().emit({
    severityNumber: SeverityNumber.ERROR,
    body: message,
    attributes: _attributes,
  })
}

export const logger = {
  info,
  warn,
  error,
}
