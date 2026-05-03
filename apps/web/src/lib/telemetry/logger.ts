import {
  context,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api"
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
  get_otel_logger().emit({
    severityNumber: SeverityNumber.WARN,
    body: message,
    attributes,
    context: context.active(),
  })
}

function info(
  message: string,
  attributes?: LogAttributes,
): void {
  get_otel_logger().emit({
    severityNumber: SeverityNumber.INFO,
    body: message,
    attributes,
    context: context.active(),
  })
}

function error(
  message: string,
  attributes?: LogAttributes,
  thrown_error?: Error,
) {
  const span = trace.getActiveSpan()
  if (span && thrown_error) {
    span.recordException(thrown_error)
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: thrown_error.message,
    })
  }

  const error_attributes: LogAttributes = {
    ...attributes,
  }
  if (thrown_error) {
    error_attributes["error.name"] = thrown_error.name
    error_attributes["error.message"] = thrown_error.message
    error_attributes["error.stack"] =
      thrown_error.stack ?? ""
  }

  get_otel_logger().emit({
    severityNumber: SeverityNumber.ERROR,
    body: message,
    attributes: error_attributes,
    context: context.active(),
  })
}

export const logger = {
  info,
  warn,
  error,
}
